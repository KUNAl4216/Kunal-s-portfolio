import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { CameraConfig, LensConfig } from '../../types/camera';

interface Camera3DProps {
  camera: CameraConfig;
  lens: LensConfig;
  isRecording: boolean;
  irEnabled: boolean;
}

// Professional camera body housing
function CameraBody() {
  return (
    <group>
      {/* Main body — matte black */}
      <mesh castShadow>
        <boxGeometry args={[1.4, 0.9, 1.0]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* Front face plate */}
      <mesh position={[0, 0, 0.51]} castShadow>
        <boxGeometry args={[1.42, 0.92, 0.02]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.5} />
      </mesh>
      {/* Rear face */}
      <mesh position={[0, 0, -0.51]}>
        <boxGeometry args={[1.42, 0.92, 0.02]} />
        <meshStandardMaterial color="#151515" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Top ventilation grooves */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[-0.4 + i * 0.09, 0.46, 0]}>
          <boxGeometry args={[0.05, 0.01, 0.6]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      {/* Side grip texture */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`grip-${i}`} position={[0.71, -0.2 + i * 0.08, 0]}>
          <boxGeometry args={[0.01, 0.04, 0.5]} />
          <meshStandardMaterial color="#222" roughness={0.8} />
        </mesh>
      ))}
      {/* Bottom plate — brushed aluminum */}
      <mesh position={[0, -0.47, 0]}>
        <boxGeometry args={[1.3, 0.02, 0.9]} />
        <meshStandardMaterial color="#444" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Tripod mount screw */}
      <mesh position={[0, -0.49, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.04, 20]} />
        <meshStandardMaterial color="#999" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Tripod mount thread */}
      <mesh position={[0, -0.52, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 12]} />
        <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Hot shoe mount */}
      <mesh position={[0, 0.47, 0]}>
        <boxGeometry args={[0.4, 0.04, 0.25]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.35, 0.02, 0.2]} />
        <meshStandardMaterial color="#666" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Rear LCD screen */}
      <mesh position={[0, 0, -0.53]}>
        <boxGeometry args={[0.9, 0.6, 0.01]} />
        <meshStandardMaterial color="#0a1520" emissive="#0a2540" emissiveIntensity={0.3} roughness={0} />
      </mesh>
      {/* LCD frame */}
      <mesh position={[0, 0, -0.525]}>
        <boxGeometry args={[0.95, 0.65, 0.005]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Mode dial on top */}
      <mesh position={[0.45, 0.5, -0.1]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 24]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Shutter button */}
      <mesh position={[0.35, 0.52, 0.2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
        <meshStandardMaterial color="#cc0000" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Multi-element lens assembly
function LensAssembly({ lens, aperture }: { lens: LensConfig; aperture: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.2;
    if (innerRingRef.current) innerRingRef.current.rotation.z -= delta * 0.15;
  });

  const lensDepth = 0.3 + (lens.focalLength / 50) * 0.5;

  return (
    <group position={[0, 0, 0.5]}>
      {/* Lens barrel — outer */}
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.38, 0.34, lensDepth, 48]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.25} metalness={0.5} />
      </mesh>
      {/* Lens barrel — inner step */}
      <mesh position={[0, 0, lensDepth * 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.34, 0.32, lensDepth * 0.4, 48]} />
        <meshStandardMaterial color="#151515" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Focus ring — rubberized */}
      <mesh ref={ringRef} position={[0, 0, lensDepth * 0.15]}>
        <torusGeometry args={[0.39, 0.035, 8, 48]} />
        <meshStandardMaterial color="#333" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Zoom ring */}
      <mesh ref={innerRingRef} position={[0, 0, lensDepth * 0.5]}>
        <torusGeometry args={[0.35, 0.03, 8, 48]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Focus ring grip knurling */}
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i / 30) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.39, Math.sin(angle) * 0.39, lensDepth * 0.15]}>
            <boxGeometry args={[0.015, 0.015, 0.05]} />
            <meshStandardMaterial color="#444" />
          </mesh>
        );
      })}
      {/* Front glass element — multi-coated */}
      <mesh position={[0, 0, lensDepth / 2 + 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.025, 48]} />
        <meshPhysicalMaterial
          color="#0a1830"
          transparent
          opacity={0.35}
          roughness={0}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0}
          ior={1.5}
        />
      </mesh>
      {/* Inner lens element 1 */}
      <mesh position={[0, 0, lensDepth / 2 - 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.015, 48]} />
        <meshPhysicalMaterial color="#0a2040" transparent opacity={0.25} roughness={0} />
      </mesh>
      {/* Inner lens element 2 */}
      <mesh position={[0, 0, lensDepth / 2 - 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.01, 48]} />
        <meshPhysicalMaterial color="#102040" transparent opacity={0.2} roughness={0} />
      </mesh>
      {/* Aperture blades (simplified) */}
      <mesh position={[0, 0, lensDepth / 2 - 0.09]}>
        <ringGeometry args={[aperture < 4 ? 0.12 : aperture < 8 ? 0.08 : 0.04, 0.22, 8]} />
        <meshStandardMaterial color="#050505" side={THREE.DoubleSide} />
      </mesh>
      {/* Red ring — pro lens indicator */}
      <mesh position={[0, 0, lensDepth * 0.7]}>
        <torusGeometry args={[0.345, 0.008, 8, 48]} />
        <meshStandardMaterial color="#cc0000" emissive="#880000" emissiveIntensity={0.5} roughness={0.3} />
      </mesh>
      {/* Lens hood */}
      <mesh position={[0, 0, lensDepth / 2 + 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.36, 0.15, 48, 1, true]} />
        <meshStandardMaterial color="#111" roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Aperture + focal length text */}
      <Text position={[0, -0.44, lensDepth / 2]} fontSize={0.06} color="#00d4ff" fontWeight={700}>
        {`f/${aperture} · ${lens.focalLength}mm`}
      </Text>
      {/* Lens brand text */}
      <Text position={[0, 0.44, lensDepth / 2]} fontSize={0.04} color="#555">
        cam::core++ OPTICS
      </Text>
    </group>
  );
}

// IR LED ring (around lens) — bigger & more dramatic
function IRRing({ enabled }: { enabled: boolean }) {
  const ledCount = 18;
  return (
    <group position={[0, 0, 0.51]}>
      {Array.from({ length: ledCount }).map((_, i) => {
        const angle = (i / ledCount) * Math.PI * 2;
        const x = Math.cos(angle) * 0.46;
        const y = Math.sin(angle) * 0.46;
        return (
          <group key={i}>
            <mesh position={[x, y, 0]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial
                color={enabled ? '#dd88ff' : '#1a1a1a'}
                emissive={enabled ? '#9933ee' : '#000'}
                emissiveIntensity={enabled ? 4 : 0}
                transparent
                opacity={0.9}
              />
            </mesh>
            {/* LED housing */}
            <mesh position={[x, y, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.015, 8]} />
              <meshStandardMaterial color="#222" />
            </mesh>
          </group>
        );
      })}
      {/* IR glow — volumetric */}
      {enabled && (
        <>
          <pointLight position={[0, 0, 0.3]} color="#9933ee" intensity={3} distance={3} />
          <mesh position={[0, 0, 0.15]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#9933ee" transparent opacity={0.04} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  );
}

// Recording LED — pulsing
function RecordingLED({ isRecording }: { isRecording: boolean }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current && isRecording) {
      ref.current.material = ref.current.material as THREE.MeshStandardMaterial;
      (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        2 + Math.sin(clock.elapsedTime * 4) * 2;
    }
  });

  return (
    <group position={[0.58, 0.35, 0.51]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial
          color={isRecording ? '#ff0000' : '#222'}
          emissive={isRecording ? '#ff0000' : '#000'}
          emissiveIntensity={isRecording ? 3 : 0}
        />
      </mesh>
      {isRecording && <pointLight color="#ff0000" intensity={0.8} distance={0.5} />}
      {/* REC label */}
      {isRecording && (
        <Text position={[0, -0.06, 0]} fontSize={0.03} color="#ff3333" fontWeight={700}>
          REC
        </Text>
      )}
    </group>
  );
}

// Status LED — power/active
function StatusLED({ isActive }: { isActive: boolean }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current && isActive) {
      (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.5 + Math.sin(clock.elapsedTime * 2) * 0.5;
    }
  });

  return (
    <group position={[-0.58, 0.35, 0.51]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial
          color={isActive ? '#00ff88' : '#222'}
          emissive={isActive ? '#00ff88' : '#000'}
          emissiveIntensity={isActive ? 2 : 0}
        />
      </mesh>
    </group>
  );
}

// CSI ribbon cable
function RibbonCable() {
  return (
    <group position={[0, -0.35, -0.5]}>
      {/* Cable connector housing */}
      <mesh>
        <boxGeometry args={[0.6, 0.05, 0.12]} />
        <meshStandardMaterial color="#222" roughness={0.5} />
      </mesh>
      {/* Connector latch */}
      <mesh position={[0, 0.03, 0.04]}>
        <boxGeometry args={[0.55, 0.02, 0.04]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Ribbon flex cable */}
      <mesh position={[0, -0.2, -0.25]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.5, 0.004, 0.6]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Ribbon traces */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-0.2 + i * 0.058, -0.2, -0.25]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.02, 0.005, 0.6]} />
          <meshStandardMaterial color="#c0a020" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// Camera model label
function CameraLabel({ camera }: { camera: CameraConfig }) {
  return (
    <group position={[0, -0.6, 0]}>
      <Text fontSize={0.09} color="#00d4ff" anchorX="center" fontWeight={700}>
        {`${camera.resolution} ${camera.sensorType} Sensor`}
      </Text>
      <Text position={[0, -0.12, 0]} fontSize={0.055} color="#5a6a7e" anchorX="center">
        {`${camera.fps}fps · ISO ${camera.iso} · ${camera.dayNightMode} mode`}
      </Text>
      <Text position={[0, -0.22, 0]} fontSize={0.04} color="#2a3a55" anchorX="center">
        cam::core++ camera_module v2.0
      </Text>
    </group>
  );
}

export function Camera3D({ camera, lens, isRecording, irEnabled }: Camera3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <CameraBody />
      <LensAssembly lens={lens} aperture={lens.aperture} />
      <IRRing enabled={irEnabled} />
      <RecordingLED isRecording={isRecording} />
      <StatusLED isActive={true} />
      <RibbonCable />
      <CameraLabel camera={camera} />
    </group>
  );
}
