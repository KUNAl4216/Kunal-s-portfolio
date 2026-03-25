import { Play, Square, Circle, Aperture, MonitorPlay, Maximize2, Zap } from 'lucide-react';
import { useCamera } from '../../contexts/CameraContext';

export function Header() {
  const { isStreaming, setIsStreaming, isRecording, setIsRecording, motionDetected, camera, previewMode } = useCamera();

  return (
    <header style={{
      height: 44,
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Aperture size={14} color="var(--accent)" style={{ filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.5))' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
            cam::core<span style={{ color: 'var(--cpp-orange)' }}>++</span>
          </span>
          <span style={{ fontSize: 9, color: '#2a3a55', marginLeft: 4 }}>
            // 3D Camera Engine
          </span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '3px 10px', borderRadius: 4,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          fontSize: 10,
        }}>
          <MonitorPlay size={10} color="var(--cpp-green)" />
          <span style={{ color: 'var(--cpp-green)' }}>{camera.resolution}</span>
          <span style={{ color: '#2a3a55' }}>@</span>
          <span style={{ color: 'var(--cpp-orange)' }}>{camera.fps}fps</span>
          <span style={{ color: '#1a2235' }}>|</span>
          <span style={{ color: 'var(--cpp-purple)', textTransform: 'capitalize' }}>{previewMode}</span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 4,
          background: 'rgba(0,255,136,0.05)',
          border: '1px solid rgba(0,255,136,0.1)',
          fontSize: 9, color: 'var(--cpp-green)',
        }}>
          <Zap size={9} />
          <span>compiled</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {motionDetected && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 4,
            background: 'rgba(255, 51, 85, 0.15)',
            border: '1px solid rgba(255, 51, 85, 0.3)',
            color: 'var(--danger)', fontSize: 10, fontWeight: 600,
            animation: 'pulse-glow 1.5s infinite',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--danger)',
              boxShadow: '0 0 6px var(--danger)',
            }} />
            MOTION::DETECTED
          </div>
        )}

        <button
          onClick={() => setIsStreaming(!isStreaming)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 4, border: 'none',
            background: isStreaming ? 'rgba(0, 255, 136, 0.1)' : 'var(--bg-tertiary)',
            color: isStreaming ? 'var(--success)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            borderWidth: 1, borderStyle: 'solid',
            borderColor: isStreaming ? 'rgba(0,255,136,0.2)' : 'var(--border-color)',
          }}
        >
          {isStreaming ? <Square size={10} /> : <Play size={10} />}
          {isStreaming ? 'stream.stop()' : 'stream.start()'}
        </button>

        <button
          onClick={() => setIsRecording(!isRecording)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 4, border: 'none',
            background: isRecording ? 'rgba(255, 51, 85, 0.1)' : 'var(--bg-tertiary)',
            color: isRecording ? 'var(--danger)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            borderWidth: 1, borderStyle: 'solid',
            borderColor: isRecording ? 'rgba(255,51,85,0.2)' : 'var(--border-color)',
          }}
        >
          <Circle size={10} fill={isRecording ? 'var(--danger)' : 'none'} />
          {isRecording ? 'rec::stop()' : 'rec::start()'}
        </button>

        <button
          onClick={() => document.documentElement.requestFullscreen?.()}
          style={{
            display: 'flex', alignItems: 'center',
            padding: 5, borderRadius: 4,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <Maximize2 size={12} />
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </header>
  );
}
