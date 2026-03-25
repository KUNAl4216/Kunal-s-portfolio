import { useRef, useEffect, useCallback, useState } from 'react';
import { Video, Image, Layers, CameraIcon, ZoomIn, ZoomOut, Download, Grid3x3, Crosshair } from 'lucide-react';
import { useCamera } from '../../contexts/CameraContext';
import { useWebcam } from '../../hooks/useWebcam';
import { useSyntheticVideo } from '../../hooks/useSyntheticVideo';
import { processFrame, detectMotion } from '../../utils/imageProcessing';

type SourceType = 'webcam' | 'synthetic';

export function CameraViewport() {
  const {
    camera, lens, isp, encoder, previewMode,
    detection, setMotionDetected, addEvent,
    board, setBoard, isRecording, isStreaming, frameCount,
  } = useCamera();

  const [source, setSource] = useState<SourceType>('synthetic');
  const [showMotionOverlay, setShowMotionOverlay] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [fps, setFps] = useState(0);
  const [motionPercent, setMotionPercent] = useState(0);
  const [snapshotFlash, setSnapshotFlash] = useState(false);
  const [frameTimeMs, setFrameTimeMs] = useState(0);

  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef(performance.now());
  const fpsCountRef = useRef(0);
  const lastMotionEventRef = useRef(0);

  const webcam = useWebcam(640, 480);
  const synthetic = useSyntheticVideo(640, 480);

  useEffect(() => {
    if (source === 'synthetic') {
      synthetic.start();
      webcam.stop();
    } else {
      synthetic.stop();
      webcam.start();
    }
    return () => {
      synthetic.stop();
      webcam.stop();
    };
  }, [source]);

  const getSourceCanvas = useCallback((): HTMLCanvasElement | null => {
    if (source === 'webcam' && webcam.videoRef.current && webcam.isActive) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 640;
      tempCanvas.height = 480;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(webcam.videoRef.current, 0, 0, 640, 480);
        return tempCanvas;
      }
    }
    if (source === 'synthetic' && synthetic.canvasRef.current) {
      return synthetic.canvasRef.current;
    }
    return null;
  }, [source, webcam.videoRef, webcam.isActive, synthetic.canvasRef]);

  // Snapshot
  const takeSnapshot = useCallback(() => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 200);

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cam01-snapshot-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');

    addEvent({ type: 'system', message: 'Snapshot captured and downloaded', severity: 'info' });
  }, [addEvent]);

  // Main render loop
  useEffect(() => {
    const targetInterval = 1000 / camera.fps;
    let lastRender = performance.now();

    const render = () => {
      const now = performance.now();
      if (now - lastRender < targetInterval) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const sourceCanvas = getSourceCanvas();
      const outputCanvas = outputCanvasRef.current;
      if (!sourceCanvas || !outputCanvas) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const frameStart = performance.now();
      processFrame(sourceCanvas, outputCanvas, camera, lens, isp, encoder, previewMode);
      setFrameTimeMs(performance.now() - frameStart);
      frameCount.current++;
      lastRender = now;

      // FPS counter
      fpsCountRef.current++;
      if (now - lastTimeRef.current >= 1000) {
        setFps(fpsCountRef.current);
        fpsCountRef.current = 0;
        lastTimeRef.current = now;
      }

      // Motion detection
      if (detection.motionEnabled) {
        const ctx = outputCanvas.getContext('2d');
        if (ctx) {
          const currentFrame = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
          const result = detectMotion(
            currentFrame, prevFrameRef.current,
            detection.motionThreshold, detection.motionSensitivity
          );

          setMotionPercent(result.diffPercentage);
          setMotionDetected(result.detected);

          if (result.detected && result.diffCanvas && showMotionOverlay) {
            const motionCanvas = motionCanvasRef.current;
            if (motionCanvas) {
              motionCanvas.width = outputCanvas.width;
              motionCanvas.height = outputCanvas.height;
              const mCtx = motionCanvas.getContext('2d');
              if (mCtx) mCtx.putImageData(result.diffCanvas, 0, 0);
            }
          }

          if (result.detected && now - lastMotionEventRef.current > 3000) {
            lastMotionEventRef.current = now;
            addEvent({
              type: 'motion',
              message: `Motion detected (${result.diffPercentage.toFixed(1)}% change)`,
              severity: 'warning',
            });
            setBoard(prev => ({
              ...prev,
              pins: prev.pins.map(p => p.id === 17 ? { ...p, state: true } : p),
            }));
            setTimeout(() => {
              setBoard(prev => ({
                ...prev,
                pins: prev.pins.map(p => p.id === 17 ? { ...p, state: false } : p),
              }));
            }, 2000);
          }

          prevFrameRef.current = currentFrame;
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [camera, lens, isp, encoder, previewMode, detection, getSourceCanvas, showMotionOverlay]);

  const pipelineColors = ['var(--pipeline-scene)', 'var(--pipeline-lens)', 'var(--pipeline-sensor)', 'var(--pipeline-isp)', 'var(--pipeline-encoder)'];
  const pipelineNames = ['Scene', 'Lens', 'Sensor', 'ISP', 'Encoder'];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0c10' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 10px', background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        flexWrap: 'wrap', gap: 4,
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {/* Source buttons */}
          {[
            { id: 'synthetic' as SourceType, icon: <Image size={11} />, label: 'Synthetic' },
            { id: 'webcam' as SourceType, icon: <Video size={11} />, label: 'Webcam' },
          ].map(src => (
            <button
              key={src.id}
              onClick={() => setSource(src.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 8px', borderRadius: 4, fontSize: 10,
                border: `1px solid ${source === src.id ? 'var(--accent)' : 'var(--border-color)'}`,
                background: source === src.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: source === src.id ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {src.icon} {src.label}
            </button>
          ))}

          <div style={{ width: 1, background: 'var(--border-color)', margin: '0 2px' }} />

          {/* Tool buttons */}
          {[
            { icon: <Layers size={11} />, active: showMotionOverlay, onClick: () => setShowMotionOverlay(!showMotionOverlay), label: 'Motion', color: 'var(--danger)' },
            { icon: <Grid3x3 size={11} />, active: showGrid, onClick: () => setShowGrid(!showGrid), label: 'Grid', color: 'var(--accent)' },
            { icon: <Crosshair size={11} />, active: showCrosshair, onClick: () => setShowCrosshair(!showCrosshair), label: 'Center', color: 'var(--warning)' },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 8px', borderRadius: 4, fontSize: 10,
                border: `1px solid ${btn.active ? btn.color : 'var(--border-color)'}`,
                background: btn.active ? `${btn.color}18` : 'transparent',
                color: btn.active ? btn.color : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {btn.icon} {btn.label}
            </button>
          ))}

          <div style={{ width: 1, background: 'var(--border-color)', margin: '0 2px' }} />

          {/* Zoom controls */}
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} style={zoomBtnStyle}>
            <ZoomOut size={11} />
          </button>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', minWidth: 32, textAlign: 'center' }}>
            {(zoom * 100).toFixed(0)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} style={zoomBtnStyle}>
            <ZoomIn size={11} />
          </button>

          <div style={{ width: 1, background: 'var(--border-color)', margin: '0 2px' }} />

          {/* Snapshot */}
          <button onClick={takeSnapshot} style={{
            ...zoomBtnStyle,
            gap: 3, padding: '3px 8px',
          }}>
            <CameraIcon size={11} /> Snap
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
          <span style={{
            padding: '2px 6px', borderRadius: 3,
            background: fps >= camera.fps * 0.8 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            color: fps >= camera.fps * 0.8 ? 'var(--success)' : 'var(--danger)',
            fontFamily: 'monospace', fontWeight: 600,
          }}>
            {fps} FPS
          </span>
          <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            {frameTimeMs.toFixed(1)}ms
          </span>
          {detection.motionEnabled && (
            <span style={{
              padding: '2px 6px', borderRadius: 3,
              background: motionPercent > 5 ? 'rgba(239,68,68,0.12)' : 'transparent',
              color: motionPercent > 5 ? 'var(--danger)' : 'var(--text-secondary)',
              fontFamily: 'monospace',
            }}>
              Δ{motionPercent.toFixed(1)}%
            </span>
          )}
          {isRecording && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 6px', borderRadius: 3,
              background: 'rgba(239,68,68,0.15)', color: 'var(--danger)',
              fontWeight: 700,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)',
                animation: 'pulse 0.8s infinite',
              }} />
              REC
            </span>
          )}
          {isStreaming && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 6px', borderRadius: 3,
              background: 'rgba(34,197,94,0.12)', color: 'var(--success)',
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: 'var(--success)',
              }} />
              LIVE
            </span>
          )}
          <span style={{
            padding: '2px 6px', borderRadius: 3,
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)', textTransform: 'uppercase',
          }}>
            {previewMode}
          </span>
        </div>
      </div>

      {/* Video Area */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Hidden elements */}
        <video ref={webcam.videoRef} style={{ display: 'none' }} playsInline muted />
        <canvas ref={synthetic.canvasRef} style={{ display: 'none' }} />

        {/* Output canvas */}
        <canvas
          ref={outputCanvasRef}
          width={640}
          height={480}
          style={{
            maxWidth: `${100 * zoom}%`,
            maxHeight: `${100 * zoom}%`,
            borderRadius: 4,
            imageRendering: 'auto',
            transition: 'max-width 0.2s, max-height 0.2s',
          }}
        />

        {/* Motion overlay */}
        {showMotionOverlay && detection.motionEnabled && (
          <canvas
            ref={motionCanvasRef}
            style={{
              position: 'absolute',
              maxWidth: `${100 * zoom}%`,
              maxHeight: `${100 * zoom}%`,
              borderRadius: 4,
              pointerEvents: 'none',
              opacity: 0.5,
              transition: 'max-width 0.2s, max-height 0.2s',
            }}
          />
        )}

        {/* Grid overlay */}
        {showGrid && (
          <svg style={{
            position: 'absolute', pointerEvents: 'none',
            width: '66%', height: '80%', opacity: 0.3,
          }}>
            {/* Rule of thirds */}
            <line x1="33.3%" y1="0" x2="33.3%" y2="100%" stroke="var(--accent)" strokeWidth="0.5" />
            <line x1="66.6%" y1="0" x2="66.6%" y2="100%" stroke="var(--accent)" strokeWidth="0.5" />
            <line x1="0" y1="33.3%" x2="100%" y2="33.3%" stroke="var(--accent)" strokeWidth="0.5" />
            <line x1="0" y1="66.6%" x2="100%" y2="66.6%" stroke="var(--accent)" strokeWidth="0.5" />
          </svg>
        )}

        {/* Crosshair overlay */}
        {showCrosshair && (
          <svg style={{
            position: 'absolute', pointerEvents: 'none',
            width: '66%', height: '80%', opacity: 0.4,
          }}>
            <line x1="50%" y1="40%" x2="50%" y2="60%" stroke="var(--warning)" strokeWidth="1" />
            <line x1="40%" y1="50%" x2="60%" y2="50%" stroke="var(--warning)" strokeWidth="1" />
            <circle cx="50%" cy="50%" r="3%" fill="none" stroke="var(--warning)" strokeWidth="0.5" />
            <circle cx="50%" cy="50%" r="8%" fill="none" stroke="var(--warning)" strokeWidth="0.3" />
          </svg>
        )}

        {/* Snapshot flash */}
        {snapshotFlash && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.6)',
            pointerEvents: 'none',
            transition: 'opacity 0.2s',
          }} />
        )}

        {/* Pipeline stage pills */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          display: 'flex', gap: 3,
        }}>
          {pipelineNames.map((stage, i) => {
            const isActive = previewMode === 'raw' ? i <= 2 :
              previewMode === 'processed' ? i <= 3 : true;
            return (
              <div key={stage} style={{
                padding: '2px 6px', borderRadius: 3, fontSize: 8,
                background: isActive ? `${pipelineColors[i]}33` : 'rgba(0,0,0,0.5)',
                color: isActive ? pipelineColors[i] : 'rgba(255,255,255,0.25)',
                border: `1px solid ${isActive ? `${pipelineColors[i]}55` : 'transparent'}`,
                fontWeight: 600,
              }}>
                {stage}
              </div>
            );
          })}
        </div>

        {/* GPIO LED indicators */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {board.pins.filter(p => p.state && p.mode === 'output').map(pin => (
            <div key={pin.id} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '2px 6px', borderRadius: 4,
              background: 'rgba(0,0,0,0.6)',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: pin.id === 18 ? '#a78bfa' : pin.id === 22 ? 'var(--danger)' : 'var(--success)',
                boxShadow: `0 0 6px ${pin.id === 18 ? '#a78bfa' : pin.id === 22 ? 'var(--danger)' : 'var(--success)'}`,
                animation: 'pulse 0.6s infinite',
              }} />
              <span style={{ fontSize: 8, color: '#fff', fontFamily: 'monospace' }}>
                GPIO{pin.id}
              </span>
            </div>
          ))}
        </div>

        {/* Camera info overlay */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          padding: '6px 10px', borderRadius: 6,
          background: 'rgba(0,0,0,0.65)', fontSize: 10,
          fontFamily: 'monospace', color: '#fff',
          backdropFilter: 'blur(4px)',
          lineHeight: 1.5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700 }}>CAM-01</span>
            <span style={{
              fontSize: 8, padding: '1px 4px', borderRadius: 3,
              background: 'rgba(34,197,94,0.3)', color: '#4ade80',
            }}>LIVE</span>
          </div>
          <div style={{ color: '#aaa' }}>
            {camera.resolution} | {camera.sensorType} | {camera.fps}fps
          </div>
          <div style={{ color: '#888' }}>
            ISO:{camera.iso} EXP:{camera.exposure} GAIN:{camera.gain}
          </div>
          <div style={{ color: '#666' }}>
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </div>
          {camera.irEnabled && (
            <div style={{ color: '#a78bfa', fontSize: 9 }}>IR NIGHT VISION</div>
          )}
        </div>

        {/* Bottom-right bitrate info */}
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          padding: '4px 8px', borderRadius: 4,
          background: 'rgba(0,0,0,0.6)', fontSize: 9,
          fontFamily: 'monospace', color: '#888',
        }}>
          <div>{encoder.codec} {encoder.bitrate}kbps {encoder.rateControl}</div>
          <div>Q:{encoder.quality} KF:{encoder.keyframeInterval}</div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  padding: '3px 5px', borderRadius: 4,
  border: '1px solid var(--border-color)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer', fontSize: 10,
};
