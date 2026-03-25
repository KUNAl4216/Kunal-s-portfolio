import { Code, Play, RotateCcw, Copy, Check, FileCode, BookOpen } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { SectionHeader } from '../common/SectionHeader';
import { useCamera } from '../../contexts/CameraContext';

const TEMPLATES: Record<string, { title: string; lang: string; desc: string; code: string }> = {
  capture: {
    title: 'Frame Capture',
    lang: 'C',
    desc: 'V4L2 frame capture callback with pixel access',
    code: `// V4L2 Frame Capture Callback
#include <linux/videodev2.h>
#include <stdio.h>

typedef struct {
    uint8_t* data;
    int width, height, stride;
    uint32_t format;  // V4L2_PIX_FMT_YUYV
    uint64_t timestamp;
    int id;
} Frame;

void onFrameCapture(Frame* frame) {
    uint8_t* data = frame->data;
    int width = frame->width;
    int height = frame->height;

    // Convert YUYV to RGB and apply filter
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x += 2) {
            int idx = (y * frame->stride) + x * 2;
            uint8_t y0 = data[idx];
            uint8_t u  = data[idx + 1];
            uint8_t y1 = data[idx + 2];
            uint8_t v  = data[idx + 3];

            // Apply brightness adjustment
            y0 = CLAMP(y0 * 1.1, 0, 255);
            y1 = CLAMP(y1 * 1.1, 0, 255);

            data[idx]     = y0;
            data[idx + 2] = y1;
        }
    }

    printf("[CAM] Frame %d: %dx%d @ ts=%lu\\n",
           frame->id, width, height, frame->timestamp);
}`,
  },
  encoding: {
    title: 'Encoder Setup',
    lang: 'C',
    desc: 'Hardware H.264 encoder initialization',
    code: `// Hardware H.264 Encoder Pipeline
#include <linux/v4l2-controls.h>
#include "encoder.h"

typedef struct {
    enum CodecType codec;  // H264, H265, MJPEG
    int width, height, fps;
    int bitrate;           // bits per second
    int gop_size;          // keyframe interval
    enum Profile profile;  // BASELINE, MAIN, HIGH
    enum RateCtrl rc;      // CBR, VBR, CQ
    int qp_min, qp_max;
} EncoderConfig;

int setup_encoder(EncoderConfig* cfg) {
    cfg->codec     = CODEC_H264;
    cfg->width     = 1920;
    cfg->height    = 1080;
    cfg->fps       = 30;
    cfg->bitrate   = 4000000;  // 4 Mbps
    cfg->gop_size  = 30;       // 1 keyframe/sec
    cfg->profile   = H264_HIGH;
    cfg->rc        = RATE_VBR;
    cfg->qp_min    = 18;
    cfg->qp_max    = 38;

    // Try hardware encoder first
    if (hw_encoder_init(cfg) == 0) {
        printf("[ENC] HW encoder: %s %s\\n",
               codec_name(cfg->codec),
               profile_name(cfg->profile));
        printf("[ENC] Output: %dx%d @ %d Mbps %s\\n",
               cfg->width, cfg->height,
               cfg->bitrate / 1000000,
               rc_name(cfg->rc));
        return 0;
    }

    // Fallback to software encoder
    fprintf(stderr, "[ENC] HW failed, using libx264\\n");
    return sw_encoder_init(cfg);
}

void encode_frame(EncoderCtx* enc, Frame* in, Packet* out) {
    int ret = encoder_send_frame(enc, in);
    if (ret < 0) return;

    while (encoder_receive_packet(enc, out) == 0) {
        if (out->flags & PKT_FLAG_KEY)
            printf("[ENC] Keyframe: %d bytes\\n", out->size);

        stream_send(out);
        packet_unref(out);
    }
}`,
  },
  streaming: {
    title: 'RTSP Stream',
    lang: 'C',
    desc: 'RTSP server with RTP packet streaming',
    code: `// RTSP Streaming Server (Live555-style)
#include "rtsp_server.h"
#include "rtp.h"

typedef struct {
    const char* url;
    enum Transport transport;  // UDP, TCP
    int mtu;
    int port;
} StreamConfig;

void start_rtsp_stream(Camera* cam) {
    RTSPServer* server = rtsp_create(554);

    StreamConfig cfg = {
        .url       = "/live/cam01",
        .transport = TRANSPORT_UDP,
        .mtu       = 1400,
        .port      = 554,
    };

    // Add H.264 media stream
    MediaSession* session = rtsp_add_stream(server, &cfg);
    session_add_subsession(session,
        h264_subsession_create(cam->encoder));

    printf("[RTSP] Server: rtsp://0.0.0.0:%d%s\\n",
           cfg.port, cfg.url);
    printf("[RTSP] Transport: %s MTU=%d\\n",
           cfg.transport == TRANSPORT_UDP ? "RTP/UDP" : "RTP/TCP",
           cfg.mtu);

    // Capture → Encode → Stream loop
    while (cam->streaming) {
        Frame* frame = camera_capture(cam);

        // Encode to NAL units
        NALUnit* nals;
        int nal_count;
        encode_frame(cam->encoder, frame, &nals, &nal_count);

        // Packetize and send via RTP
        for (int i = 0; i < nal_count; i++) {
            RTPPacket* pkt = rtp_packetize(&nals[i], cfg.mtu);
            rtsp_send_rtp(server, pkt);
            rtp_free(pkt);
        }

        frame_release(frame);

        // Rate control - maintain target FPS
        usleep(1000000 / cam->fps);
    }

    rtsp_destroy(server);
}`,
  },
  gpio: {
    title: 'GPIO Motion',
    lang: 'C',
    desc: 'PIR sensor interrupt with camera trigger',
    code: `// GPIO-based Motion Detection Trigger
#include <wiringPi.h>
#include <stdio.h>
#include <stdlib.h>

#define PIR_PIN     4    // PIR sensor input
#define LED_PIN     17   // Status LED output
#define IR_PIN      18   // IR LED (PWM)
#define BUZZER_PIN  22   // Alarm buzzer
#define RELAY_PIN   24   // Relay for NVR

volatile int motion_active = 0;
Camera* g_cam = NULL;

void motion_callback(void) {
    if (motion_active) return;
    motion_active = 1;

    printf("[GPIO] Motion on pin %d!\\n", PIR_PIN);

    // Activate indicators
    digitalWrite(LED_PIN, HIGH);
    digitalWrite(BUZZER_PIN, HIGH);

    // Start recording
    camera_start_recording(g_cam);
    printf("[CAM] Recording started\\n");

    // Enable IR if dark
    if (ambient_light() < 50) {
        pwmWrite(IR_PIN, 1024);  // Full IR
        camera_set_mode(g_cam, MODE_NIGHT);
        printf("[IR] Night vision ON\\n");
    }

    // Trigger NVR relay
    digitalWrite(RELAY_PIN, HIGH);

    // Send alert via network
    send_motion_alert(g_cam->last_snapshot);

    // Hold for 10 seconds
    delay(10000);

    // Deactivate
    digitalWrite(LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);
    pwmWrite(IR_PIN, 0);
    digitalWrite(RELAY_PIN, LOW);
    camera_stop_recording(g_cam);

    motion_active = 0;
    printf("[GPIO] Motion sequence complete\\n");
}

int main(void) {
    wiringPiSetupGpio();

    pinMode(PIR_PIN, INPUT);
    pullUpDnControl(PIR_PIN, PUD_DOWN);
    pinMode(LED_PIN, OUTPUT);
    pinMode(IR_PIN, PWM_OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(RELAY_PIN, OUTPUT);

    g_cam = camera_init("/dev/video0", 1920, 1080, 30);

    // Register interrupt on rising edge
    wiringPiISR(PIR_PIN, INT_EDGE_RISING, &motion_callback);

    printf("[SYS] Camera security system active\\n");
    printf("[SYS] Waiting for motion...\\n");

    while (1) delay(1000);
    return 0;
}`,
  },
  isp: {
    title: 'ISP Pipeline',
    lang: 'C',
    desc: 'Image Signal Processor pipeline stages',
    code: `// ISP (Image Signal Processor) Pipeline
#include "isp.h"
#include <math.h>

typedef struct {
    float white_balance[3];  // RGB gains
    float gamma;
    float exposure_ev;
    int denoise_strength;
    enum ColorSpace color_space;
} ISPConfig;

// Stage 1: Black Level Correction
void isp_black_level(Frame* f, int black_level) {
    for (int i = 0; i < f->size; i++) {
        f->data[i] = MAX(0, f->data[i] - black_level);
    }
}

// Stage 2: Defective Pixel Correction
void isp_dpc(Frame* f, int threshold) {
    // Replace hot/dead pixels with neighbor median
    for (int y = 1; y < f->height - 1; y++) {
        for (int x = 1; x < f->width - 1; x++) {
            int val = PIXEL(f, x, y);
            int med = median_3x3(f, x, y);
            if (abs(val - med) > threshold)
                SET_PIXEL(f, x, y, med);
        }
    }
}

// Stage 3: White Balance
void isp_awb(Frame* f, float r_gain, float g_gain, float b_gain) {
    for (int i = 0; i < f->size; i += 3) {
        f->data[i]   = CLAMP(f->data[i] * r_gain, 0, 255);
        f->data[i+1] = CLAMP(f->data[i+1] * g_gain, 0, 255);
        f->data[i+2] = CLAMP(f->data[i+2] * b_gain, 0, 255);
    }
}

// Stage 4: Gamma Correction
void isp_gamma(Frame* f, float gamma) {
    uint8_t lut[256];
    for (int i = 0; i < 256; i++)
        lut[i] = (uint8_t)(pow(i / 255.0, 1.0 / gamma) * 255);

    for (int i = 0; i < f->size; i++)
        f->data[i] = lut[f->data[i]];
}

// Full ISP pipeline
void isp_process(Frame* raw, Frame* out, ISPConfig* cfg) {
    frame_copy(raw, out);
    isp_black_level(out, 16);
    isp_dpc(out, 30);
    isp_awb(out, cfg->white_balance[0],
                  cfg->white_balance[1],
                  cfg->white_balance[2]);
    isp_gamma(out, cfg->gamma);
    printf("[ISP] Processed: %dx%d\\n", out->width, out->height);
}`,
  },
  python: {
    title: 'Python OpenCV',
    lang: 'Python',
    desc: 'OpenCV camera capture with detection',
    code: `# OpenCV Camera Pipeline with Motion Detection
import cv2
import numpy as np
from datetime import datetime

class CameraSystem:
    def __init__(self, device=0, width=1920, height=1080):
        self.cap = cv2.VideoCapture(device)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        self.cap.set(cv2.CAP_PROP_FPS, 30)

        self.prev_frame = None
        self.recording = False
        self.writer = None

        print(f"[CAM] Initialized: {width}x{height} @ 30fps")

    def detect_motion(self, frame, threshold=25, min_area=500):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)

        if self.prev_frame is None:
            self.prev_frame = gray
            return False, frame

        delta = cv2.absdiff(self.prev_frame, gray)
        thresh = cv2.threshold(delta, threshold, 255,
                              cv2.THRESH_BINARY)[1]
        thresh = cv2.dilate(thresh, None, iterations=2)

        contours, _ = cv2.findContours(thresh,
            cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        motion = False
        for c in contours:
            if cv2.contourArea(c) < min_area:
                continue
            motion = True
            (x, y, w, h) = cv2.boundingRect(c)
            cv2.rectangle(frame, (x,y), (x+w,y+h), (0,255,0), 2)

        self.prev_frame = gray
        return motion, frame

    def run(self):
        print("[SYS] Camera system running...")
        while True:
            ret, frame = self.cap.read()
            if not ret: break

            motion, annotated = self.detect_motion(frame)

            if motion:
                ts = datetime.now().strftime("%H:%M:%S")
                print(f"[MOTION] Detected at {ts}")
                cv2.putText(annotated, "MOTION",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX,
                    1, (0, 0, 255), 2)

            cv2.imshow("Camera", annotated)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        self.cap.release()

if __name__ == "__main__":
    cam = CameraSystem(device=0)
    cam.run()`,
  },
};

// Simple syntax highlighter
function highlightSyntax(code: string, lang: string): string {
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  html = html.replace(/(\/\/.*$)/gm, '<span style="color:#6a9955">$1</span>');
  html = html.replace(/(#\s.*$)/gm, '<span style="color:#6a9955">$1</span>');
  html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6a9955">$1</span>');

  // Strings
  html = html.replace(/("(?:[^"\\]|\\.)*?")/g, '<span style="color:#ce9178">$1</span>');
  html = html.replace(/('(?:[^'\\]|\\.)*?')/g, '<span style="color:#ce9178">$1</span>');

  // Keywords
  const cKeywords = lang === 'Python'
    ? /\b(import|from|def|class|if|else|while|for|return|self|None|True|False|print|with|as|in|not|and|or|try|except)\b/g
    : /\b(int|void|char|uint8_t|uint32_t|uint64_t|float|double|struct|typedef|enum|if|else|while|for|return|const|volatile|static|extern|include|define|sizeof|NULL|printf|fprintf)\b/g;
  html = html.replace(cKeywords, '<span style="color:#569cd6">$1</span>');

  // Numbers
  html = html.replace(/\b(\d+\.?\d*[fF]?)\b/g, '<span style="color:#b5cea8">$1</span>');

  // Preprocessor
  html = html.replace(/(#include|#define|#ifdef|#endif)/g, '<span style="color:#c586c0">$1</span>');

  // Function calls
  html = html.replace(/(\w+)\s*\(/g, '<span style="color:#dcdcaa">$1</span>(');

  return html;
}

export function DeveloperPanel() {
  const { addEvent } = useCamera();
  const [activeTemplate, setActiveTemplate] = useState<string>('capture');
  const [code, setCode] = useState(TEMPLATES.capture.code);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHighlighted, setShowHighlighted] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  const currentTemplate = TEMPLATES[activeTemplate];

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runCode = useCallback(() => {
    setIsRunning(true);
    setOutput(prev => [...prev, '', `> === Compiling ${activeTemplate}.${currentTemplate.lang === 'Python' ? 'py' : 'c'} ===`]);

    setTimeout(() => {
      if (currentTemplate.lang === 'C') {
        setOutput(prev => [...prev, `> gcc -O2 -Wall -o ${activeTemplate} ${activeTemplate}.c -lcamera -lencoder`]);
      } else {
        setOutput(prev => [...prev, `> python3 ${activeTemplate}.py`]);
      }

      setTimeout(() => {
        setOutput(prev => [...prev, '> Build successful ✓']);

        setTimeout(() => {
          setOutput(prev => [...prev, `> ./${activeTemplate}`, '']);

          const mockOutputs: Record<string, string[]> = {
            capture: [
              '[CAM] V4L2 device opened: /dev/video0',
              '[CAM] Format: YUYV 1920x1080',
              '[CAM] Frame 0: 1920x1080 @ ts=1710672000',
              '[CAM] Frame 1: 1920x1080 @ ts=1710672033',
              '[CAM] Frame 2: 1920x1080 @ ts=1710672066',
              '> Processing at 30.1 FPS (avg 33.2ms/frame)',
            ],
            encoding: [
              '[ENC] HW encoder: H264 HIGH',
              '[ENC] Output: 1920x1080 @ 4 Mbps VBR',
              '[ENC] QP range: 18-38',
              '[ENC] Keyframe: 42856 bytes',
              '[ENC] Avg bitrate: 3.82 Mbps',
              '> Encoder running: 30fps input → 30fps output',
            ],
            streaming: [
              '[RTSP] Server: rtsp://0.0.0.0:554/live/cam01',
              '[RTSP] Transport: RTP/UDP MTU=1400',
              '[RTSP] Session created: H264/90000',
              '[RTSP] Client connected: 192.168.1.50:49152',
              '[RTSP] Streaming: 127 NALs/sec, 3.8 Mbps',
              '> Stream active: 1 client(s)',
            ],
            gpio: [
              '[SYS] Camera security system active',
              '[SYS] GPIO4: PIR INPUT (PULL_DOWN)',
              '[SYS] GPIO17: LED OUTPUT',
              '[SYS] GPIO18: IR PWM OUTPUT',
              '[SYS] Waiting for motion...',
              '[GPIO] Motion on pin 4!',
              '[CAM] Recording started',
              '[IR] Night vision ON',
              '> Motion sequence: LED=ON BUZZER=ON IR=1024',
            ],
            isp: [
              '[ISP] Pipeline initialized',
              '[ISP] Stage 1: Black level correction (BLC=16)',
              '[ISP] Stage 2: Defective pixel correction',
              '[ISP] Stage 3: Auto white balance (R=1.2 G=1.0 B=0.9)',
              '[ISP] Stage 4: Gamma correction (γ=1.0)',
              '[ISP] Processed: 1920x1080',
              '> ISP latency: 8.3ms/frame',
            ],
            python: [
              '[CAM] Initialized: 1920x1080 @ 30fps',
              '[SYS] Camera system running...',
              '[MOTION] Detected at 12:45:02',
              '[MOTION] Detected at 12:45:03',
              '[MOTION] Area: 2340px, Contours: 3',
              '> OpenCV pipeline: 28.5 FPS',
            ],
          };

          const results = mockOutputs[activeTemplate] || ['> Execution completed'];
          results.forEach((line, i) => {
            setTimeout(() => {
              setOutput(prev => [...prev, line]);
            }, i * 250);
          });

          setTimeout(() => {
            setIsRunning(false);
            setOutput(prev => [...prev, '', `> Process exited (code 0) [${(Math.random() * 2 + 0.5).toFixed(1)}s]`]);
            addEvent({ type: 'system', message: `Dev: ${currentTemplate.title} executed successfully`, severity: 'info' });
          }, results.length * 250 + 300);
        }, 400);
      }, 600);
    }, 500);
  }, [activeTemplate, currentTemplate, addEvent]);

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <SectionHeader
        icon={<Code size={18} color="var(--accent)" />}
        title="Developer Mode"
        subtitle="Embedded C/C++/Python code simulation"
      />

      {/* Template Selection */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <BookOpen size={11} />
          Code Templates
        </div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {Object.entries(TEMPLATES).map(([key, tmpl]) => (
            <button
              key={key}
              onClick={() => {
                setActiveTemplate(key);
                setCode(tmpl.code);
              }}
              style={{
                padding: '4px 8px', borderRadius: 4, fontSize: 10,
                border: `1px solid ${activeTemplate === key ? 'var(--accent)' : 'var(--border-color)'}`,
                background: activeTemplate === key ? 'rgba(59,130,246,0.15)' : 'var(--bg-tertiary)',
                color: activeTemplate === key ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {tmpl.title}
            </button>
          ))}
        </div>
      </div>

      {/* Code Editor */}
      <div style={{
        borderRadius: 8, overflow: 'hidden',
        border: '1px solid var(--border-color)',
        marginBottom: 10,
      }}>
        {/* Editor Header */}
        <div style={{
          padding: '5px 10px', fontSize: 10,
          background: '#1e1e2e',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #2d2d3d',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileCode size={11} color="var(--accent)" />
            <span style={{ color: '#ccc' }}>{activeTemplate}.{currentTemplate.lang === 'Python' ? 'py' : 'c'}</span>
            <span style={{
              fontSize: 8, padding: '1px 5px', borderRadius: 3,
              background: currentTemplate.lang === 'Python' ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)',
              color: currentTemplate.lang === 'Python' ? '#58a6ff' : '#22c55e',
            }}>{currentTemplate.lang}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={copyCode} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: copied ? 'var(--success)' : '#888', padding: 2,
            }}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        {/* Code content */}
        {showHighlighted ? (
          <div
            style={{
              padding: '10px 12px', background: '#1e1e1e',
              fontFamily: '"Fira Code", "Cascadia Code", monospace',
              fontSize: 11, lineHeight: 1.6,
              height: 260, overflowY: 'auto',
              color: '#d4d4d4', whiteSpace: 'pre',
              cursor: 'text',
            }}
            onClick={() => setShowHighlighted(false)}
            dangerouslySetInnerHTML={{ __html: highlightSyntax(code, currentTemplate.lang) }}
          />
        ) : (
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            onBlur={() => setShowHighlighted(true)}
            autoFocus
            spellCheck={false}
            style={{
              width: '100%', height: 260, padding: '10px 12px',
              background: '#1e1e1e', color: '#d4d4d4',
              border: 'none', resize: 'none',
              fontFamily: '"Fira Code", "Cascadia Code", monospace',
              fontSize: 11, lineHeight: 1.6, outline: 'none',
            }}
          />
        )}

        {/* Editor footer */}
        <div style={{
          padding: '3px 10px', fontSize: 9,
          background: '#007acc', color: '#fff',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>{currentTemplate.desc}</span>
          <span>Ln {code.split('\n').length} | {currentTemplate.lang}</span>
        </div>
      </div>

      {/* Run Controls */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button
          onClick={runCode}
          disabled={isRunning}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 0', borderRadius: 6, border: 'none',
            background: isRunning ? 'var(--bg-tertiary)' : 'var(--success)',
            color: isRunning ? 'var(--text-secondary)' : '#fff',
            cursor: isRunning ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600,
          }}
        >
          <Play size={14} />
          {isRunning ? 'Compiling & Running...' : 'Build & Run'}
        </button>
        <button
          onClick={() => setOutput([])}
          style={{
            padding: '8px 14px', borderRadius: 6, border: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
          }}
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {/* Output Console */}
      <div style={{
        borderRadius: 8, overflow: 'hidden',
        border: '1px solid var(--border-color)',
      }}>
        <div style={{
          padding: '4px 10px', fontSize: 10,
          background: '#1e1e2e',
          color: '#888',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #2d2d3d',
        }}>
          <span>Terminal Output</span>
          <span>{output.length} lines</span>
        </div>
        <div
          ref={scrollRef}
          style={{
            padding: 10, background: '#0d1117',
            fontFamily: 'monospace', fontSize: 10,
            minHeight: 100, maxHeight: 180, overflowY: 'auto',
            color: '#8b949e', lineHeight: 1.5,
          }}
        >
          {output.length === 0 ? (
            <span style={{ opacity: 0.4 }}>{'>'} Ready. Click "Build & Run" to execute...</span>
          ) : output.map((line, i) => (
            <div key={i} style={{
              color: line.startsWith('>')
                ? '#58a6ff'
                : line.includes('error') || line.includes('failed')
                  ? '#f85149'
                  : line.includes('✓') || line.includes('successful')
                    ? '#3fb950'
                    : line.startsWith('[')
                      ? '#c9d1d9'
                      : '#8b949e',
              marginBottom: 1,
            }}>
              {line || '\u00A0'}
            </div>
          ))}
          {isRunning && (
            <span style={{ color: '#58a6ff', animation: 'blink 1s infinite' }}>█</span>
          )}
        </div>
      </div>

      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
    </div>
  );
}
