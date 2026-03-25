import { Camera, Sun, Moon, Aperture, RotateCcw, Zap, Eye } from 'lucide-react';
import { useRef, useEffect, useCallback } from 'react';
import { useCamera } from '../../contexts/CameraContext';
import { SliderControl } from '../common/SliderControl';
import { SectionHeader } from '../common/SectionHeader';
import { ToggleSwitch } from '../common/ToggleSwitch';
import type { Resolution, DayNightMode, CameraConfig } from '../../types/camera';

const PRESETS: { name: string; icon: string; config: Partial<CameraConfig> }[] = [
  {
    name: 'Daylight',
    icon: '☀️',
    config: { exposure: 40, gain: 15, iso: 200, brightness: 5, contrast: 10, saturation: 10, noiseReduction: 20, dayNightMode: 'day', irEnabled: false },
  },
  {
    name: 'Low Light',
    icon: '🌙',
    config: { exposure: 80, gain: 60, iso: 3200, brightness: 15, contrast: -5, saturation: -10, noiseReduction: 70, dayNightMode: 'night', irEnabled: false },
  },
  {
    name: 'IR Night',
    icon: '👁',
    config: { exposure: 70, gain: 55, iso: 2400, brightness: 10, contrast: 15, saturation: -50, noiseReduction: 60, dayNightMode: 'night', irEnabled: true },
  },
  {
    name: 'High Motion',
    icon: '⚡',
    config: { exposure: 20, gain: 40, iso: 800, brightness: 0, contrast: 15, saturation: 0, noiseReduction: 30, fps: 60 },
  },
  {
    name: 'Studio',
    icon: '🎬',
    config: { exposure: 50, gain: 20, iso: 400, brightness: 0, contrast: 5, saturation: 15, sharpness: 60, noiseReduction: 40, dayNightMode: 'day' },
  },
  {
    name: 'Noisy',
    icon: '📡',
    config: { exposure: 90, gain: 90, iso: 6400, brightness: -10, contrast: -10, saturation: -20, noiseReduction: 0, dayNightMode: 'night' },
  },
];

// Histogram component
function Histogram({ camera }: { camera: CameraConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Simulate histogram based on camera settings
    const bins = 64;
    const rHist = new Float32Array(bins);
    const gHist = new Float32Array(bins);
    const bHist = new Float32Array(bins);

    // Generate histogram shape based on exposure/gain/brightness
    const center = (camera.exposure / 100) * 0.6 + 0.2;
    const spread = 0.15 + (camera.gain / 100) * 0.2;
    const shift = camera.brightness / 100;

    for (let i = 0; i < bins; i++) {
      const x = i / bins;
      const gaussian = Math.exp(-((x - center - shift) ** 2) / (2 * spread * spread));
      const noise = (camera.iso / 6400) * Math.random() * 0.3;

      rHist[i] = gaussian * (1 + (camera.saturation > 0 ? 0.2 : 0)) + noise;
      gHist[i] = gaussian * 1.1 + noise;
      bHist[i] = gaussian * (1 + (camera.saturation < 0 ? 0.15 : 0)) + noise;
    }

    // Draw background
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, w, h);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (h / 4) * i);
      ctx.lineTo(w, (h / 4) * i);
      ctx.stroke();
    }

    const drawChannel = (hist: Float32Array, color: string) => {
      const max = Math.max(...hist) || 1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < bins; i++) {
        const x = (i / bins) * w;
        const y = h - (hist[i] / max) * h * 0.85;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    };

    drawChannel(rHist, 'rgba(255, 80, 80, 0.25)');
    drawChannel(gHist, 'rgba(80, 255, 80, 0.25)');
    drawChannel(bHist, 'rgba(80, 80, 255, 0.25)');

    // Luminance (combined)
    const lumHist = new Float32Array(bins);
    for (let i = 0; i < bins; i++) {
      lumHist[i] = rHist[i] * 0.299 + gHist[i] * 0.587 + bHist[i] * 0.114;
    }
    drawChannel(lumHist, 'rgba(220, 220, 220, 0.35)');

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '8px monospace';
    ctx.fillText('0', 2, h - 2);
    ctx.fillText('255', w - 18, h - 2);
  }, [camera]);

  useEffect(() => {
    draw();
    const id = setInterval(draw, 500);
    return () => clearInterval(id);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={272}
      height={70}
      style={{ width: '100%', height: 70, borderRadius: 6, border: '1px solid var(--border-color)' }}
    />
  );
}

// Sensor info card
function SensorInfo({ camera }: { camera: CameraConfig }) {
  const resMap: Record<string, { w: number; h: number; mp: string }> = {
    '720p': { w: 1280, h: 720, mp: '0.9' },
    '1080p': { w: 1920, h: 1080, mp: '2.1' },
    '4MP': { w: 2560, h: 1440, mp: '3.7' },
    '5MP': { w: 2592, h: 1944, mp: '5.0' },
  };
  const res = resMap[camera.resolution] || resMap['1080p'];

  return (
    <div style={{
      padding: 10, borderRadius: 8, marginBottom: 14,
      background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Aperture size={14} color="var(--pipeline-sensor)" />
          <span style={{ fontSize: 12, fontWeight: 600 }}>CMOS Sensor</span>
        </div>
        <span style={{
          fontSize: 9, padding: '2px 6px', borderRadius: 4,
          background: 'rgba(34,197,94,0.15)', color: 'var(--success)',
          fontWeight: 600,
        }}>ACTIVE</span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6,
        fontSize: 10, color: 'var(--text-secondary)',
      }}>
        <div style={{ padding: 4, borderRadius: 4, background: 'var(--bg-primary)', textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{res.mp}MP</div>
          <div>Megapixels</div>
        </div>
        <div style={{ padding: 4, borderRadius: 4, background: 'var(--bg-primary)', textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{res.w}x{res.h}</div>
          <div>Resolution</div>
        </div>
        <div style={{ padding: 4, borderRadius: 4, background: 'var(--bg-primary)', textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{camera.fps}fps</div>
          <div>Frame Rate</div>
        </div>
      </div>

      <div style={{
        marginTop: 6, padding: '4px 6px', borderRadius: 4,
        background: camera.irEnabled ? 'rgba(139,92,246,0.1)' : camera.dayNightMode === 'night' ? 'rgba(59,130,246,0.1)' : 'rgba(234,179,8,0.1)',
        fontSize: 10, display: 'flex', alignItems: 'center', gap: 4,
        color: camera.irEnabled ? '#a78bfa' : camera.dayNightMode === 'night' ? 'var(--accent)' : 'var(--warning)',
      }}>
        {camera.irEnabled ? <Eye size={10} /> : camera.dayNightMode === 'night' ? <Moon size={10} /> : <Sun size={10} />}
        {camera.irEnabled ? 'IR Night Vision Active' : camera.dayNightMode === 'night' ? 'Night Mode' : camera.dayNightMode === 'auto' ? 'Auto Day/Night' : 'Day Mode'}
        <span style={{ marginLeft: 'auto', fontFamily: 'monospace' }}>
          ISO {camera.iso} | EV {(camera.exposure / 50).toFixed(1)}
        </span>
      </div>
    </div>
  );
}

export function CameraPanel() {
  const { camera, setCamera } = useCamera();

  const update = <K extends keyof typeof camera>(key: K, value: (typeof camera)[K]) =>
    setCamera(prev => ({ ...prev, [key]: value }));

  const applyPreset = (preset: Partial<CameraConfig>) => {
    setCamera(prev => ({ ...prev, ...preset }));
  };

  const resetDefaults = () => {
    setCamera({
      sensorType: 'CMOS', resolution: '1080p', fps: 30,
      exposure: 50, gain: 30, iso: 400, dayNightMode: 'day',
      irEnabled: false, noiseReduction: 50, brightness: 0,
      contrast: 0, saturation: 0, sharpness: 50,
    });
  };

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <SectionHeader
        icon={<Camera size={18} color="var(--accent)" />}
        title="Camera Hardware"
        subtitle="Configure virtual camera sensor"
      />

      {/* Sensor Info Card */}
      <SensorInfo camera={camera} />

      {/* Presets */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Zap size={11} />
            Quick Presets
          </span>
          <button onClick={resetDefaults} style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <RotateCcw size={10} /> Reset
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          {PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.config)}
              style={{
                padding: '6px 4px', borderRadius: 6, border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)', cursor: 'pointer',
                fontSize: 10, color: 'var(--text-primary)', textAlign: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }}
            >
              <div style={{ fontSize: 14, marginBottom: 2 }}>{preset.icon}</div>
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Histogram */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          Histogram
          <span style={{ fontSize: 9, color: 'var(--text-secondary)', marginLeft: 'auto' }}>R G B Lum</span>
        </div>
        <Histogram camera={camera} />
      </div>

      {/* Resolution */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
          Resolution
        </label>
        <select
          value={camera.resolution}
          onChange={e => update('resolution', e.target.value as Resolution)}
        >
          <option value="720p">720p HD (1280x720)</option>
          <option value="1080p">1080p Full HD (1920x1080)</option>
          <option value="4MP">4MP (2560x1440)</option>
          <option value="5MP">5MP (2592x1944)</option>
        </select>
      </div>

      {/* FPS */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
          Frame Rate
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[15, 30, 60].map(fps => (
            <button
              key={fps}
              onClick={() => update('fps', fps)}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 6,
                border: `1px solid ${camera.fps === fps ? 'var(--accent)' : 'var(--border-color)'}`,
                background: camera.fps === fps ? 'rgba(59,130,246,0.15)' : 'var(--bg-tertiary)',
                color: camera.fps === fps ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 12,
              }}
            >
              {fps} FPS
            </button>
          ))}
        </div>
      </div>

      {/* Exposure group */}
      <div style={{
        padding: 10, borderRadius: 8, marginBottom: 10,
        background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pipeline-sensor)', marginBottom: 8 }}>
          Exposure Controls
        </div>
        <SliderControl label="Exposure" value={camera.exposure} min={0} max={100} onChange={v => update('exposure', v)} />
        <SliderControl label="Gain" value={camera.gain} min={0} max={100} onChange={v => update('gain', v)} />
        <SliderControl label="ISO" value={camera.iso} min={100} max={6400} step={100} onChange={v => update('iso', v)} />
      </div>

      {/* Image adjustment group */}
      <div style={{
        padding: 10, borderRadius: 8, marginBottom: 10,
        background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>
          Image Adjustments
        </div>
        <SliderControl label="Brightness" value={camera.brightness} min={-50} max={50} onChange={v => update('brightness', v)} />
        <SliderControl label="Contrast" value={camera.contrast} min={-50} max={50} onChange={v => update('contrast', v)} />
        <SliderControl label="Saturation" value={camera.saturation} min={-50} max={50} onChange={v => update('saturation', v)} />
        <SliderControl label="Sharpness" value={camera.sharpness} min={0} max={100} onChange={v => update('sharpness', v)} />
        <SliderControl label="Noise Reduction" value={camera.noiseReduction} min={0} max={100} onChange={v => update('noiseReduction', v)} />
      </div>

      {/* Day/Night Mode */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          Day/Night Mode
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['day', 'night', 'auto'] as DayNightMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => update('dayNightMode', mode)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 6,
                border: `1px solid ${camera.dayNightMode === mode ? 'var(--accent)' : 'var(--border-color)'}`,
                background: camera.dayNightMode === mode ? 'rgba(59,130,246,0.15)' : 'var(--bg-tertiary)',
                color: camera.dayNightMode === mode ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              {mode === 'day' ? <Sun size={12} /> : mode === 'night' ? <Moon size={12} /> : null}
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <ToggleSwitch label="IR LED (Infrared)" checked={camera.irEnabled} onChange={v => update('irEnabled', v)} />

      {/* Sensor Technical Info */}
      <div style={{
        marginTop: 14, padding: 10, borderRadius: 8,
        background: 'var(--bg-tertiary)', fontSize: 10,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>Sensor Specs</div>
        {[
          { label: 'Type', value: '1/2.7" CMOS' },
          { label: 'Pixel Size', value: '2.9μm x 2.9μm' },
          { label: 'Dynamic Range', value: `${Math.round(55 + (camera.gain / 100) * 25)}dB` },
          { label: 'SNR', value: `${Math.round(45 - (camera.iso / 6400) * 20)}dB` },
          { label: 'Min Illumination', value: camera.irEnabled ? '0 Lux (IR)' : '0.01 Lux' },
          { label: 'Shutter', value: `1/${Math.round(camera.fps * (camera.exposure / 50))}s ~ 1/${camera.fps}s` },
        ].map(spec => (
          <div key={spec.label} style={{
            display: 'flex', justifyContent: 'space-between', padding: '2px 0',
            color: 'var(--text-secondary)',
          }}>
            <span>{spec.label}</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
