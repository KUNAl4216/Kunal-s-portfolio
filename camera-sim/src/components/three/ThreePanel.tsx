import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid, PerspectiveCamera, Stars } from '@react-three/drei';
import { Board3D } from './Board3D';
import { Camera3D } from './Camera3D';
import { Scene3D } from './Scene3D';
import { useCamera } from '../../contexts/CameraContext';
import { Box, Camera, MapPin, RotateCcw, Layers, Aperture } from 'lucide-react';

type View3D = 'board' | 'camera' | 'scene' | 'full-setup';

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00d4ff" wireframe />
    </mesh>
  );
}

// Full setup: board + camera together
function FullSetup() {
  const { board, setBoard, camera, lens, isRecording } = useCamera();

  const handlePinClick = (pinId: number) => {
    setBoard(prev => ({
      ...prev,
      pins: prev.pins.map(p => p.id === pinId ? { ...p, state: !p.state } : p),
    }));
  };

  return (
    <group>
      {/* Board */}
      <group position={[0, -0.5, 0]} rotation={[0.2, 0, 0]}>
        <Board3D board={board} onPinClick={handlePinClick} />
      </group>

      {/* Camera module connected above */}
      <group position={[0, 1.5, 0]} scale={0.5}>
        <Camera3D
          camera={camera}
          lens={lens}
          isRecording={isRecording}
          irEnabled={camera.irEnabled}
        />
      </group>

      {/* Ribbon cable connecting them */}
      <mesh position={[0, 0.5, -0.2]}>
        <boxGeometry args={[0.3, 1.2, 0.005]} />
        <meshStandardMaterial color="#ddd" transparent opacity={0.6} side={2} />
      </mesh>
    </group>
  );
}

export function ThreePanel() {
  const { board, setBoard, camera, lens, isRecording } = useCamera();
  const [view, setView] = useState<View3D>('full-setup');
  const [autoRotate, setAutoRotate] = useState(true);

  const handlePinClick = (pinId: number) => {
    setBoard(prev => ({
      ...prev,
      pins: prev.pins.map(p => p.id === pinId ? { ...p, state: !p.state } : p),
    }));
  };

  const views: { id: View3D; icon: React.ReactNode; label: string; cppLabel: string }[] = [
    { id: 'full-setup', icon: <Layers size={11} />, label: 'Full Setup', cppLabel: 'setup::full()' },
    { id: 'board', icon: <Box size={11} />, label: 'Board', cppLabel: 'board::render()' },
    { id: 'camera', icon: <Camera size={11} />, label: 'Camera', cppLabel: 'camera::render()' },
    { id: 'scene', icon: <MapPin size={11} />, label: '3D Scene', cppLabel: 'scene::render()' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#050608' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 12px', background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Aperture size={12} color="var(--accent)" style={{ marginRight: 6, filter: 'drop-shadow(0 0 3px rgba(0,212,255,0.4))' }} />
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 3, fontSize: 10,
                border: `1px solid ${view === v.id ? 'var(--accent)' : 'var(--border-color)'}`,
                background: view === v.id ? 'rgba(0,212,255,0.1)' : 'transparent',
                color: view === v.id ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.15s',
              }}
            >
              {v.icon}
              <span>{v.cppLabel}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', borderRadius: 3, fontSize: 9,
              border: `1px solid ${autoRotate ? 'var(--cpp-green)' : 'var(--border-color)'}`,
              background: autoRotate ? 'rgba(0,255,136,0.08)' : 'transparent',
              color: autoRotate ? 'var(--cpp-green)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <RotateCcw size={10} /> autoRotate
          </button>

          <span style={{
            fontSize: 9, padding: '3px 8px', borderRadius: 3,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: '#2a3a55',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            scroll=zoom · drag=rotate
          </span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas shadows>
          <PerspectiveCamera
            makeDefault
            position={view === 'scene' ? [8, 6, 12] : [3, 2.5, 4]}
            fov={view === 'scene' ? 60 : 45}
          />

          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.4}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={30}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <pointLight position={[-3, 3, -3]} intensity={0.2} color="#00d4ff" />
          <pointLight position={[3, 2, 3]} intensity={0.15} color="#00ff88" />

          {/* Stars for all views */}
          <Stars radius={80} depth={40} count={3000} factor={3} fade speed={0.5} />

          {/* Environment */}
          <Environment preset={view === 'scene' ? 'night' : 'studio'} />

          {/* Content */}
          <Suspense fallback={<LoadingFallback />}>
            {view === 'board' && (
              <Board3D board={board} onPinClick={handlePinClick} />
            )}

            {view === 'camera' && (
              <Camera3D
                camera={camera}
                lens={lens}
                isRecording={isRecording}
                irEnabled={camera.irEnabled}
              />
            )}

            {view === 'scene' && <Scene3D />}

            {view === 'full-setup' && <FullSetup />}
          </Suspense>

          {/* Ground / shadows */}
          {view !== 'scene' && (
            <>
              <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={8} blur={2} far={4} />
              <Grid
                position={[0, -1.2, 0]}
                args={[12, 12]}
                cellSize={0.5}
                cellThickness={0.5}
                cellColor="#0a1520"
                sectionSize={2}
                sectionThickness={1}
                sectionColor="#0a2540"
                fadeDistance={15}
                infiniteGrid
              />
            </>
          )}

          <OrbitControls
            autoRotate={autoRotate && view !== 'scene'}
            autoRotateSpeed={0.8}
            enableDamping
            dampingFactor={0.05}
            minDistance={view === 'scene' ? 5 : 2}
            maxDistance={view === 'scene' ? 30 : 12}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>

        {/* Top-left: C++ style namespace breadcrumb */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          padding: '5px 10px', borderRadius: 4,
          background: 'rgba(5,6,8,0.85)',
          border: '1px solid rgba(0,212,255,0.15)',
          backdropFilter: 'blur(8px)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          color: '#2a3a55',
        }}>
          <span style={{ color: 'var(--cpp-purple)' }}>namespace</span>{' '}
          <span style={{ color: 'var(--accent)' }}>cam</span>
          <span style={{ color: '#5a6a7e' }}>::</span>
          <span style={{ color: 'var(--cpp-green)' }}>
            {view === 'board' ? 'board' : view === 'camera' ? 'camera' : view === 'scene' ? 'scene' : 'setup'}
          </span>{' '}
          <span style={{ color: '#1a2235' }}>{'{'}</span>
        </div>

        {/* Bottom-left: Info overlay */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          padding: '8px 12px', borderRadius: 4,
          background: 'rgba(5,6,8,0.85)',
          border: '1px solid rgba(0,212,255,0.1)',
          backdropFilter: 'blur(8px)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 11, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--cpp-purple)' }}>class</span>{' '}
            {view === 'board' ? 'Board3D' : view === 'camera' ? 'Camera3D' : view === 'scene' ? 'Scene3D' : 'FullSetup'}
            <span style={{ color: '#1a2235', fontWeight: 400, fontSize: 9 }}>// 3D render</span>
          </div>
          {view === 'board' && (
            <div style={{ fontSize: 9, color: '#5a6a7e' }}>
              <span style={{ color: 'var(--cpp-green)' }}>{board.name}</span> · gpio::{' '}
              <span style={{ color: 'var(--cpp-orange)' }}>{board.pins.filter(p => p.state).length}/{board.pins.length}</span> active
              · cpu: <span style={{ color: board.cpuUsage > 70 ? 'var(--danger)' : 'var(--cpp-green)' }}>{Math.round(board.cpuUsage)}%</span>
              · temp: <span style={{ color: board.temperature > 60 ? 'var(--danger)' : 'var(--cpp-orange)' }}>{Math.round(board.temperature)}°C</span>
            </div>
          )}
          {view === 'camera' && (
            <div style={{ fontSize: 9, color: '#5a6a7e' }}>
              <span style={{ color: 'var(--cpp-green)' }}>{camera.resolution}</span>{' '}
              <span style={{ color: 'var(--cpp-orange)' }}>{camera.sensorType}</span> · f/
              <span style={{ color: 'var(--accent)' }}>{lens.aperture}</span>{' '}
              <span style={{ color: 'var(--accent)' }}>{lens.focalLength}mm</span>
              · ISO <span style={{ color: 'var(--cpp-orange)' }}>{camera.iso}</span>
              · {camera.irEnabled ? <span style={{ color: 'var(--cpp-purple)' }}>IR::ON</span> : <span>{camera.dayNightMode}</span>}
            </div>
          )}
          {view === 'scene' && (
            <div style={{ fontSize: 9, color: '#5a6a7e' }}>
              buildings: <span style={{ color: 'var(--cpp-orange)' }}>4</span> · cars: <span style={{ color: 'var(--accent)' }}>2</span> · people: <span style={{ color: 'var(--cpp-green)' }}>3</span> · cams: <span style={{ color: 'var(--danger)' }}>2</span> · lamps: <span style={{ color: 'var(--warning)' }}>4</span>
            </div>
          )}
          {view === 'full-setup' && (
            <div style={{ fontSize: 9, color: '#5a6a7e' }}>
              <span style={{ color: 'var(--cpp-green)' }}>{board.name}</span>
              <span style={{ color: '#1a2235' }}> + </span>
              <span style={{ color: 'var(--accent)' }}>{camera.resolution}</span> Camera Module
              <span style={{ color: '#1a2235' }}> // click GPIO pins</span>
            </div>
          )}
        </div>

        {/* Bottom-right: closing brace */}
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          padding: '4px 8px', borderRadius: 4,
          background: 'rgba(5,6,8,0.85)',
          border: '1px solid rgba(0,212,255,0.08)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, color: '#1a2235',
        }}>
          {'}'} <span style={{ color: '#2a3a55' }}>// end namespace</span>
        </div>

        {/* GPIO quick status for board/full-setup views */}
        {(view === 'board' || view === 'full-setup') && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            padding: '8px 10px', borderRadius: 4,
            background: 'rgba(5,6,8,0.85)',
            border: '1px solid rgba(0,212,255,0.1)',
            backdropFilter: 'blur(8px)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>
              gpio::status<span style={{ color: 'var(--cpp-orange)' }}>()</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {board.pins.map(pin => (
                <div
                  key={pin.id}
                  onClick={() => handlePinClick(pin.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '2px 6px', borderRadius: 2, cursor: 'pointer',
                    background: pin.state ? 'rgba(0,255,136,0.08)' : 'transparent',
                    fontSize: 8, color: pin.state ? 'var(--cpp-green)' : '#2a3a55',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: pin.state ? 'var(--cpp-green)' : '#1a2235',
                    boxShadow: pin.state ? '0 0 4px var(--cpp-green)' : 'none',
                  }} />
                  GPIO{pin.id}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
