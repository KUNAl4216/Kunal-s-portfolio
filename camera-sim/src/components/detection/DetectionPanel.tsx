import { Activity, Bell, Video, Lightbulb, Shield, MapPin, BarChart3 } from 'lucide-react';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useCamera } from '../../contexts/CameraContext';
import { SectionHeader } from '../common/SectionHeader';
import { SliderControl } from '../common/SliderControl';
import { ToggleSwitch } from '../common/ToggleSwitch';

// Motion heatmap mini-view
function MotionHeatmap({ motionDetected }: { motionDetected: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatmapRef = useRef<Float32Array>(new Float32Array(16 * 12));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cols = 16;
    const rows = 12;
    const cellW = w / cols;
    const cellH = h / rows;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    const heat = heatmapRef.current;

    // Decay existing heat
    for (let i = 0; i < heat.length; i++) {
      heat[i] *= 0.92;
    }

    // Add new motion spots
    if (motionDetected) {
      for (let i = 0; i < 5; i++) {
        const idx = Math.floor(Math.random() * heat.length);
        heat[idx] = Math.min(heat[idx] + 0.3 + Math.random() * 0.5, 1);
      }
      // Simulate walking person area (bottom-left)
      const personCol = 3 + Math.floor(Math.sin(Date.now() / 1000) * 2);
      const personRow = 8;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = (personRow + dy) * cols + (personCol + dx);
          if (idx >= 0 && idx < heat.length) {
            heat[idx] = Math.min(heat[idx] + 0.6, 1);
          }
        }
      }

      // Simulate car area (middle)
      const carCol = Math.floor((Date.now() / 100) % cols);
      const carRow = 9;
      for (let dx = 0; dx < 3; dx++) {
        const idx = carRow * cols + ((carCol + dx) % cols);
        if (idx >= 0 && idx < heat.length) {
          heat[idx] = Math.min(heat[idx] + 0.8, 1);
        }
      }
    }

    // Draw heatmap
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const val = heat[row * cols + col];
        if (val > 0.02) {
          const r = Math.min(255, val * 500);
          const g = Math.min(255, Math.max(0, (val - 0.3) * 400));
          const b = 0;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${val * 0.8})`;
          ctx.fillRect(col * cellW, row * cellH, cellW - 1, cellH - 1);
        } else {
          ctx.fillStyle = 'rgba(30, 40, 50, 0.3)';
          ctx.fillRect(col * cellW, row * cellH, cellW - 1, cellH - 1);
        }
      }
    }

    // Grid overlay
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let col = 0; col <= cols; col++) {
      ctx.beginPath();
      ctx.moveTo(col * cellW, 0);
      ctx.lineTo(col * cellW, h);
      ctx.stroke();
    }
    for (let row = 0; row <= rows; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * cellH);
      ctx.lineTo(w, row * cellH);
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '8px monospace';
    ctx.fillText('MOTION HEATMAP', 4, 10);
  }, [motionDetected]);

  useEffect(() => {
    const id = setInterval(draw, 100);
    return () => clearInterval(id);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={192}
      style={{
        width: '100%', height: 120, borderRadius: 6,
        border: '1px solid var(--border-color)',
      }}
    />
  );
}

// Detection zone editor
function DetectionZones() {
  const [zones, setZones] = useState([
    { id: 1, name: 'Zone A - Entrance', enabled: true, color: '#3b82f6' },
    { id: 2, name: 'Zone B - Parking', enabled: true, color: '#22c55e' },
    { id: 3, name: 'Zone C - Perimeter', enabled: false, color: '#eab308' },
  ]);

  return (
    <div style={{
      padding: 10, borderRadius: 8, marginBottom: 14,
      background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, fontWeight: 600, marginBottom: 8,
        color: 'var(--text-primary)',
      }}>
        <MapPin size={12} />
        Detection Zones
      </div>
      {zones.map((zone, i) => (
        <div key={zone.id} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 0', borderBottom: i < zones.length - 1 ? '1px solid var(--border-color)' : 'none',
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: 3,
            background: zone.enabled ? zone.color : 'var(--border-color)',
          }} />
          <span style={{ fontSize: 10, flex: 1, color: 'var(--text-secondary)' }}>{zone.name}</span>
          <button
            onClick={() => setZones(prev => prev.map(z => z.id === zone.id ? { ...z, enabled: !z.enabled } : z))}
            style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 9,
              border: `1px solid ${zone.enabled ? zone.color : 'var(--border-color)'}`,
              background: zone.enabled ? `${zone.color}22` : 'transparent',
              color: zone.enabled ? zone.color : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {zone.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      ))}
    </div>
  );
}

// Motion statistics
function MotionStats({ motionDetected }: { motionDetected: boolean }) {
  const [stats, setStats] = useState({
    eventsToday: 0,
    avgDuration: 0,
    peakHour: '—',
    lastEvent: '—',
  });

  useEffect(() => {
    if (motionDetected) {
      setStats(prev => ({
        eventsToday: prev.eventsToday + 1,
        avgDuration: Math.round(Math.random() * 5 + 2),
        peakHour: new Date().getHours() + ':00',
        lastEvent: new Date().toLocaleTimeString(),
      }));
    }
  }, [motionDetected]);

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
      marginBottom: 14,
    }}>
      {[
        { label: 'Events Today', value: String(stats.eventsToday), color: 'var(--accent)' },
        { label: 'Avg Duration', value: `${stats.avgDuration}s`, color: 'var(--warning)' },
        { label: 'Peak Hour', value: stats.peakHour, color: 'var(--pipeline-isp)' },
        { label: 'Last Event', value: stats.lastEvent, color: 'var(--text-secondary)' },
      ].map(stat => (
        <div key={stat.label} style={{
          padding: 8, borderRadius: 6, background: 'var(--bg-tertiary)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: stat.color, fontFamily: 'monospace' }}>
            {stat.value}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2 }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export function DetectionPanel() {
  const { detection, setDetection, motionDetected, board, setBoard, addEvent, setIsRecording } = useCamera();

  const triggerActions = [
    {
      label: 'LED ON (GPIO 17)',
      icon: <Lightbulb size={14} />,
      desc: 'Toggle status LED when motion detected',
      active: board.pins.find(p => p.id === 17)?.state ?? false,
      onToggle: () => {
        setBoard(prev => ({
          ...prev,
          pins: prev.pins.map(p => p.id === 17 ? { ...p, state: !p.state } : p),
        }));
        addEvent({ type: 'gpio', message: 'LED toggled via motion trigger', severity: 'info' });
      },
    },
    {
      label: 'Send Alert',
      icon: <Bell size={14} />,
      desc: 'Push notification / webhook on motion',
      active: detection.motionEnabled,
      onToggle: () => {
        addEvent({ type: 'motion', message: 'Alert triggered: Motion detected in Zone A', severity: 'warning' });
      },
    },
    {
      label: 'Start Recording',
      icon: <Video size={14} />,
      desc: 'Auto-record on motion event',
      active: false,
      onToggle: () => {
        setIsRecording(true);
        addEvent({ type: 'motion', message: 'Auto-recording started (motion trigger)', severity: 'info' });
        setTimeout(() => setIsRecording(false), 5000);
      },
    },
    {
      label: 'Activate Buzzer (GPIO 22)',
      icon: <Shield size={14} />,
      desc: 'Sound buzzer alarm on intrusion',
      active: board.pins.find(p => p.id === 22)?.state ?? false,
      onToggle: () => {
        setBoard(prev => ({
          ...prev,
          pins: prev.pins.map(p => p.id === 22 ? { ...p, state: !p.state } : p),
        }));
        addEvent({ type: 'gpio', message: 'Buzzer alarm toggled', severity: 'warning' });
      },
    },
  ];

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <SectionHeader
        icon={<Activity size={18} color="var(--accent)" />}
        title="Detection System"
        subtitle="Motion, object & face detection"
      />

      {/* Motion Status Card */}
      <div style={{
        padding: 12, borderRadius: 8, marginBottom: 14,
        background: motionDetected ? 'rgba(239,68,68,0.08)' : 'var(--bg-tertiary)',
        border: `1.5px solid ${motionDetected ? 'var(--danger)' : 'var(--border-color)'}`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 700,
          color: motionDetected ? 'var(--danger)' : 'var(--text-secondary)',
        }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: motionDetected ? 'var(--danger)' : 'var(--border-color)',
            animation: motionDetected ? 'pulse 0.8s infinite' : 'none',
            boxShadow: motionDetected ? '0 0 10px rgba(239,68,68,0.5)' : 'none',
          }} />
          {motionDetected ? 'MOTION DETECTED' : 'NO MOTION'}
        </div>
        {motionDetected && (
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>
            Active zones: Zone A, Zone B | Confidence: {Math.round(70 + Math.random() * 25)}%
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6,
        }}>
          <BarChart3 size={11} />
          Motion Heatmap (Live)
        </div>
        <MotionHeatmap motionDetected={motionDetected} />
      </div>

      {/* Motion Stats */}
      <MotionStats motionDetected={motionDetected} />

      {/* Detection Zones */}
      <DetectionZones />

      {/* Controls */}
      <ToggleSwitch
        label="Enable Motion Detection"
        checked={detection.motionEnabled}
        onChange={v => setDetection(p => ({ ...p, motionEnabled: v }))}
      />

      <SliderControl
        label="Sensitivity"
        value={detection.motionSensitivity}
        min={0} max={100}
        onChange={v => setDetection(p => ({ ...p, motionSensitivity: v }))}
      />

      <SliderControl
        label="Threshold"
        value={detection.motionThreshold}
        min={5} max={100}
        onChange={v => setDetection(p => ({ ...p, motionThreshold: v }))}
      />

      <ToggleSwitch
        label="Object Detection (Mock AI)"
        checked={detection.objectDetectionEnabled}
        onChange={v => {
          setDetection(p => ({ ...p, objectDetectionEnabled: v }));
          if (v) addEvent({ type: 'object', message: 'Object detection model loaded (YOLOv5 mock)', severity: 'info' });
        }}
      />

      <ToggleSwitch
        label="Face Detection"
        checked={detection.faceDetectionEnabled}
        onChange={v => {
          setDetection(p => ({ ...p, faceDetectionEnabled: v }));
          if (v) addEvent({ type: 'face', message: 'Face detection enabled (Haar cascade mock)', severity: 'info' });
        }}
      />

      {/* Trigger Actions */}
      <div style={{ marginTop: 16 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Lightbulb size={12} color="var(--warning)" />
          Trigger Actions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {triggerActions.map(action => (
            <button
              key={action.label}
              onClick={action.onToggle}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px', borderRadius: 8, textAlign: 'left',
                border: `1px solid ${action.active ? 'var(--success)' : 'var(--border-color)'}`,
                background: action.active ? 'rgba(34,197,94,0.06)' : 'var(--bg-tertiary)',
                color: action.active ? 'var(--success)' : 'var(--text-secondary)',
                cursor: 'pointer', width: '100%',
              }}
            >
              <div style={{ marginTop: 1 }}>{action.icon}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{action.label}</div>
                <div style={{ fontSize: 9, opacity: 0.7, marginTop: 1 }}>{action.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}
