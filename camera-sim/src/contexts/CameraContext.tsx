import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import type {
  CameraConfig, LensConfig, ISPConfig, EncoderConfig,
  StreamConfig, DetectionConfig, EmbeddedBoard, EventLog,
  GPIOPin, PreviewMode, PipelineStage
} from '../types/camera';

interface CameraContextType {
  camera: CameraConfig;
  setCamera: React.Dispatch<React.SetStateAction<CameraConfig>>;
  lens: LensConfig;
  setLens: React.Dispatch<React.SetStateAction<LensConfig>>;
  isp: ISPConfig;
  setIsp: React.Dispatch<React.SetStateAction<ISPConfig>>;
  encoder: EncoderConfig;
  setEncoder: React.Dispatch<React.SetStateAction<EncoderConfig>>;
  stream: StreamConfig;
  setStream: React.Dispatch<React.SetStateAction<StreamConfig>>;
  detection: DetectionConfig;
  setDetection: React.Dispatch<React.SetStateAction<DetectionConfig>>;
  board: EmbeddedBoard;
  setBoard: React.Dispatch<React.SetStateAction<EmbeddedBoard>>;
  previewMode: PreviewMode;
  setPreviewMode: React.Dispatch<React.SetStateAction<PreviewMode>>;
  events: EventLog[];
  addEvent: (event: Omit<EventLog, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
  pipelineStages: PipelineStage[];
  isStreaming: boolean;
  setIsStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  motionDetected: boolean;
  setMotionDetected: React.Dispatch<React.SetStateAction<boolean>>;
  frameCount: React.MutableRefObject<number>;
}

const defaultCamera: CameraConfig = {
  sensorType: 'CMOS',
  resolution: '1080p',
  fps: 30,
  exposure: 50,
  gain: 30,
  iso: 400,
  dayNightMode: 'day',
  irEnabled: false,
  noiseReduction: 50,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 50,
};

const defaultLens: LensConfig = {
  focalLength: 3.6,
  aperture: 2.0,
  blur: 0,
  distortion: 0,
  focusDistance: 50,
};

const defaultISP: ISPConfig = {
  whiteBalance: 5500,
  autoExposure: true,
  exposureCompensation: 0,
  gamma: 1.0,
  denoise: 30,
  colorMode: 'normal',
};

const defaultEncoder: EncoderConfig = {
  codec: 'H264',
  bitrate: 4000,
  keyframeInterval: 30,
  quality: 80,
  rateControl: 'VBR',
};

const defaultStream: StreamConfig = {
  protocol: 'RTSP',
  port: 554,
  latency: 50,
  packetLoss: 0,
  jitter: 0,
  enabled: false,
};

const defaultDetection: DetectionConfig = {
  motionEnabled: true,
  motionSensitivity: 50,
  motionThreshold: 30,
  objectDetectionEnabled: false,
  faceDetectionEnabled: false,
};

const defaultPins: GPIOPin[] = [
  { id: 2, label: 'SDA (I2C)', mode: 'input', state: false, type: 'i2c' },
  { id: 3, label: 'SCL (I2C)', mode: 'input', state: false, type: 'i2c' },
  { id: 4, label: 'PIR Sensor', mode: 'input', state: false, type: 'digital' },
  { id: 17, label: 'LED Status', mode: 'output', state: false, type: 'digital' },
  { id: 18, label: 'IR LED PWM', mode: 'output', state: false, type: 'pwm' },
  { id: 22, label: 'Buzzer', mode: 'output', state: false, type: 'digital' },
  { id: 23, label: 'Button Input', mode: 'input', state: false, type: 'digital' },
  { id: 24, label: 'Relay Output', mode: 'output', state: false, type: 'digital' },
];

const defaultBoard: EmbeddedBoard = {
  type: 'raspberry-pi',
  name: 'Raspberry Pi 4B',
  pins: defaultPins,
  cameraConnected: true,
  cpuUsage: 35,
  memoryUsage: 42,
  temperature: 48,
};

const defaultPipelineStages: PipelineStage[] = [
  { name: 'Scene', color: 'var(--pipeline-scene)', enabled: true, processing: false, latencyMs: 0 },
  { name: 'Lens', color: 'var(--pipeline-lens)', enabled: true, processing: false, latencyMs: 2 },
  { name: 'Sensor', color: 'var(--pipeline-sensor)', enabled: true, processing: false, latencyMs: 8 },
  { name: 'ISP', color: 'var(--pipeline-isp)', enabled: true, processing: false, latencyMs: 12 },
  { name: 'Encoder', color: 'var(--pipeline-encoder)', enabled: true, processing: false, latencyMs: 16 },
  { name: 'Stream', color: 'var(--pipeline-stream)', enabled: true, processing: false, latencyMs: 5 },
];

const CameraContext = createContext<CameraContextType | null>(null);

export function CameraProvider({ children }: { children: ReactNode }) {
  const [camera, setCamera] = useState<CameraConfig>(defaultCamera);
  const [lens, setLens] = useState<LensConfig>(defaultLens);
  const [isp, setIsp] = useState<ISPConfig>(defaultISP);
  const [encoder, setEncoder] = useState<EncoderConfig>(defaultEncoder);
  const [stream, setStream] = useState<StreamConfig>(defaultStream);
  const [detection, setDetection] = useState<DetectionConfig>(defaultDetection);
  const [board, setBoard] = useState<EmbeddedBoard>(defaultBoard);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('processed');
  const [events, setEvents] = useState<EventLog[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [motionDetected, setMotionDetected] = useState(false);
  const frameCount = useRef(0);

  const addEvent = useCallback((event: Omit<EventLog, 'id' | 'timestamp'>) => {
    const newEvent: EventLog = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 200));
  }, []);

  const clearEvents = useCallback(() => setEvents([]), []);

  const pipelineStages = defaultPipelineStages;

  return (
    <CameraContext.Provider value={{
      camera, setCamera,
      lens, setLens,
      isp, setIsp,
      encoder, setEncoder,
      stream, setStream,
      detection, setDetection,
      board, setBoard,
      previewMode, setPreviewMode,
      events, addEvent, clearEvents,
      pipelineStages,
      isStreaming, setIsStreaming,
      isRecording, setIsRecording,
      motionDetected, setMotionDetected,
      frameCount,
    }}>
      {children}
    </CameraContext.Provider>
  );
}

export function useCamera() {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error('useCamera must be used within CameraProvider');
  return ctx;
}
