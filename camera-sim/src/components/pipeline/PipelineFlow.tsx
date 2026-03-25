import { useCamera } from '../../contexts/CameraContext';
import { useState, useEffect, useRef } from 'react';

export function PipelineFlow() {
  const { pipelineStages, previewMode, camera, encoder, stream, isStreaming, lens, isp, frameCount } = useCamera();
  const [activeParticle, setActiveParticle] = useState(0);
  const [throughput, setThroughput] = useState(0);
  const lastFrameRef = useRef(0);

  // Animate data flow particles
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveParticle(p => (p + 1) % 6);

      // Calculate throughput
      const current = frameCount.current;
      setThroughput(current - lastFrameRef.current);
      lastFrameRef.current = current;
    }, 200);
    return () => clearInterval(interval);
  }, [frameCount]);

  const activeIndex = previewMode === 'raw' ? 2 : previewMode === 'processed' ? 3 : 5;

  const stageDetails: Record<string, { detail: string; metric: string }> = {
    'Scene': {
      detail: 'Input Source',
      metric: `${camera.fps} fps`,
    },
    'Lens': {
      detail: `f/${lens.aperture} ${lens.focalLength}mm`,
      metric: `blur:${lens.blur} dist:${lens.distortion}`,
    },
    'Sensor': {
      detail: `${camera.resolution} ${camera.sensorType}`,
      metric: `ISO:${camera.iso} G:${camera.gain}`,
    },
    'ISP': {
      detail: `WB:${isp.whiteBalance}K ${isp.colorMode}`,
      metric: `γ:${isp.gamma} DN:${isp.denoise}`,
    },
    'Encoder': {
      detail: `${encoder.codec} ${encoder.rateControl}`,
      metric: `${encoder.bitrate}kbps Q:${encoder.quality}`,
    },
    'Stream': {
      detail: isStreaming ? `${stream.protocol}:${stream.port}` : 'Idle',
      metric: isStreaming ? `${stream.latency}ms lat` : 'Not active',
    },
  };

  return (
    <div style={{
      height: 96,
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 4,
      overflowX: 'auto',
    }}>
      {/* Pipeline label */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 2,
        minWidth: 64, marginRight: 4,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 1 }}>
          PIPELINE
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
          {throughput * 5} fps
        </div>
        <div style={{
          fontSize: 8, color: 'var(--success)', fontFamily: 'monospace',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: 'var(--success)',
            animation: 'pulse-dot 1.5s infinite',
          }} />
          ACTIVE
        </div>
      </div>

      {pipelineStages.map((stage, i) => {
        const isActive = i <= activeIndex;
        const isProcessing = isActive && activeParticle >= i;
        const info = stageDetails[stage.name] || { detail: '', metric: '' };

        return (
          <div key={stage.name} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {/* Stage card */}
            <div style={{
              padding: '6px 10px', borderRadius: 8,
              background: isActive ? `${stage.color}12` : 'var(--bg-tertiary)',
              border: `1.5px solid ${isActive ? `${stage.color}55` : 'var(--border-color)'}`,
              opacity: isActive ? 1 : 0.3,
              transition: 'all 0.3s',
              minWidth: 100,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Processing indicator bar */}
              {isProcessing && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent, ${stage.color}, transparent)`,
                  animation: 'scan-bar 0.8s infinite',
                }} />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: isActive ? stage.color : 'var(--border-color)',
                  boxShadow: isProcessing ? `0 0 6px ${stage.color}` : 'none',
                  transition: 'box-shadow 0.2s',
                }} />
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: isActive ? stage.color : 'var(--text-secondary)',
                }}>
                  {stage.name}
                </span>
              </div>

              <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 1 }}>
                {info.detail}
              </div>
              <div style={{
                fontSize: 8, color: 'var(--text-secondary)',
                fontFamily: 'monospace', opacity: 0.8,
              }}>
                {info.metric}
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 3, paddingTop: 3,
                borderTop: `1px solid ${isActive ? `${stage.color}22` : 'var(--border-color)'}`,
              }}>
                <span style={{ fontSize: 8, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {stage.latencyMs}ms
                </span>
                <span style={{
                  fontSize: 7, padding: '1px 4px', borderRadius: 3,
                  background: isActive ? `${stage.color}22` : 'transparent',
                  color: isActive ? stage.color : 'var(--text-secondary)',
                }}>
                  {isActive ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Animated connector */}
            {i < pipelineStages.length - 1 && (
              <div style={{
                width: 28, height: 2, position: 'relative',
                background: isActive ? `${stage.color}33` : 'var(--border-color)',
                margin: '0 2px',
              }}>
                {/* Data flow dot */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: -2,
                    left: activeParticle === i ? '0%' : activeParticle > i ? '100%' : '-10%',
                    width: 6, height: 6, borderRadius: '50%',
                    background: stage.color,
                    boxShadow: `0 0 6px ${stage.color}`,
                    transition: 'left 0.2s ease',
                    opacity: activeParticle >= i && activeParticle <= i + 1 ? 1 : 0,
                  }} />
                )}
                {/* Arrow head */}
                <div style={{
                  position: 'absolute', right: -4, top: -3,
                  width: 0, height: 0,
                  borderTop: '4px solid transparent',
                  borderBottom: '4px solid transparent',
                  borderLeft: `5px solid ${isActive ? `${stage.color}66` : 'var(--border-color)'}`,
                }} />
              </div>
            )}
          </div>
        );
      })}

      {/* Stats panel */}
      <div style={{
        marginLeft: 'auto', padding: '8px 12px',
        borderRadius: 8, background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        minWidth: 95,
      }}>
        <div style={{ fontSize: 8, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>
          TOTAL LATENCY
        </div>
        <div style={{
          fontSize: 16, fontWeight: 700, fontFamily: 'monospace',
          color: 'var(--text-primary)',
        }}>
          {pipelineStages.filter((_, i) => i <= activeIndex).reduce((sum, s) => sum + s.latencyMs, 0)}ms
        </div>
        <div style={{
          fontSize: 8, color: 'var(--text-secondary)',
          marginTop: 2, fontFamily: 'monospace',
        }}>
          Frames: {frameCount.current}
        </div>
      </div>

      <style>{`
        @keyframes scan-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
