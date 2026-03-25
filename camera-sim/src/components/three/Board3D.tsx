import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { EmbeddedBoard, BoardType } from '../../types/camera';

interface Board3DProps {
  board: EmbeddedBoard;
  onPinClick?: (pinId: number) => void;
}

// PCB Board
function PCB({ boardType }: { boardType: BoardType }) {
  const size = boardType === 'esp32' ? [2.2, 0.12, 1.6] : [3.4, 0.12, 2.2];
  return (
    <group>
      {/* Main PCB */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={size as [number, number, number]} />
        <meshStandardMaterial color="#1a5c2a" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* PCB traces (decorative lines) */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`trace-h-${i}`} position={[-1.2 + i * 0.24, 0.065, Math.sin(i * 0.7) * 0.6]}>
          <boxGeometry args={[0.18, 0.005, 0.01]} />
          <meshStandardMaterial color="#2d8a4e" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`trace-v-${i}`} position={[Math.cos(i * 0.9) * 0.8, 0.065, -0.8 + i * 0.22]}>
          <boxGeometry args={[0.01, 0.005, 0.2]} />
          <meshStandardMaterial color="#2d8a4e" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      {/* Mounting holes */}
      {[[-1.5, 0, -0.9], [1.5, 0, -0.9], [-1.5, 0, 0.9], [1.5, 0, 0.9]].map((pos, i) => (
        <mesh key={`hole-${i}`} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.08, 0.08, 0.14, 16]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

// CPU/SoC Chip
function CPUChip({ boardType, cpuUsage }: { boardType: BoardType; cpuUsage: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const glowIntensity = cpuUsage / 100;

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05;
    }
  });

  const chipSize = boardType === 'esp32' ? 0.35 : 0.5;

  return (
    <group position={[0, 0.15, -0.1]}>
      {/* Heat spreader */}
      <mesh castShadow>
        <boxGeometry args={[chipSize, 0.08, chipSize]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Chip label */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[chipSize * 0.8, 0.02, chipSize * 0.8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* CPU glow based on usage */}
      <pointLight
        position={[0, 0.15, 0]}
        color={cpuUsage > 70 ? '#ff4444' : cpuUsage > 40 ? '#ffaa00' : '#44ff44'}
        intensity={glowIntensity * 0.5}
        distance={1}
      />
      {/* Chip text */}
      <Text position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.08} color="#888">
        {boardType === 'raspberry-pi' ? 'BCM2711' : boardType === 'esp32' ? 'ESP32-S' : 'ARM'}
      </Text>
    </group>
  );
}

// GPIO Pin Row
function GPIOPins({ board, onPinClick, side }: { board: EmbeddedBoard; onPinClick?: (id: number) => void; side: 'left' | 'right' }) {
  const pins = side === 'left' ? board.pins.slice(0, 4) : board.pins.slice(4);
  const xPos = side === 'left' ? -1.4 : 1.4;

  return (
    <group>
      {pins.map((pin, i) => {
        const zPos = -0.6 + i * 0.35;
        return (
          <group key={pin.id} position={[xPos, 0.1, zPos]}>
            {/* Pin metal */}
            <mesh
              castShadow
              onClick={(e) => { e.stopPropagation(); onPinClick?.(pin.id); }}
              onPointerOver={(e) => { document.body.style.cursor = 'pointer'; (e.object as THREE.Mesh).scale.set(1.3, 1.3, 1.3); }}
              onPointerOut={(e) => { document.body.style.cursor = 'default'; (e.object as THREE.Mesh).scale.set(1, 1, 1); }}
            >
              <cylinderGeometry args={[0.03, 0.03, 0.25, 8]} />
              <meshStandardMaterial
                color={pin.state ? '#ffd700' : '#888'}
                metalness={0.8}
                roughness={0.2}
                emissive={pin.state ? '#ffd700' : '#000'}
                emissiveIntensity={pin.state ? 0.5 : 0}
              />
            </mesh>
            {/* LED indicator for output pins */}
            {pin.mode === 'output' && (
              <mesh position={[side === 'left' ? -0.15 : 0.15, 0.05, 0]}>
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshStandardMaterial
                  color={pin.state ? (pin.id === 18 ? '#a855f6' : pin.id === 22 ? '#ef4444' : '#22c55e') : '#333'}
                  emissive={pin.state ? (pin.id === 18 ? '#a855f6' : pin.id === 22 ? '#ef4444' : '#22c55e') : '#000'}
                  emissiveIntensity={pin.state ? 2 : 0}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            )}
            {/* Pin glow when active */}
            {pin.state && (
              <pointLight
                position={[side === 'left' ? -0.15 : 0.15, 0.1, 0]}
                color={pin.id === 18 ? '#a855f6' : pin.id === 22 ? '#ef4444' : '#22c55e'}
                intensity={1.5}
                distance={0.6}
              />
            )}
            {/* Pin label */}
            <Text
              position={[side === 'left' ? -0.3 : 0.3, 0.15, 0]}
              fontSize={0.06}
              color={pin.state ? '#fff' : '#666'}
              anchorX={side === 'left' ? 'right' : 'left'}
            >
              {`GPIO${pin.id}`}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

// USB Ports
function USBPorts({ boardType }: { boardType: BoardType }) {
  if (boardType === 'esp32') return null;
  return (
    <group position={[1.7, 0.18, 0]}>
      {[0, 0.35].map((z, i) => (
        <mesh key={i} position={[0, 0, -0.2 + z]} castShadow>
          <boxGeometry args={[0.22, 0.14, 0.25]} />
          <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <Text position={[0.12, 0.1, 0.3]} fontSize={0.06} color="#666" rotation={[0, -Math.PI / 2, 0]}>
        USB 3.0
      </Text>
    </group>
  );
}

// Ethernet Port
function EthernetPort({ boardType }: { boardType: BoardType }) {
  if (boardType === 'esp32') return null;
  return (
    <group position={[1.7, 0.2, 0.6]}>
      <mesh castShadow>
        <boxGeometry args={[0.28, 0.22, 0.3]} />
        <meshStandardMaterial color="#999" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Activity LEDs */}
      <mesh position={[-0.1, 0.12, 0.1]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[0.05, 0.12, 0.1]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

// HDMI Port
function HDMIPort() {
  return (
    <group position={[0.3, 0.12, -1.1]}>
      <mesh castShadow>
        <boxGeometry args={[0.28, 0.08, 0.12]} />
        <meshStandardMaterial color="#222" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

// Power / USB-C
function PowerPort() {
  return (
    <group position={[-0.4, 0.12, -1.1]}>
      <mesh castShadow>
        <boxGeometry args={[0.18, 0.06, 0.1]} />
        <meshStandardMaterial color="#444" metalness={0.6} roughness={0.3} />
      </mesh>
      <Text position={[0, 0.06, -0.08]} fontSize={0.05} color="#666" rotation={[-Math.PI / 2, 0, 0]}>
        USB-C
      </Text>
    </group>
  );
}

// SD Card Slot
function SDCardSlot() {
  return (
    <group position={[-1.55, -0.02, 0.5]}>
      <mesh>
        <boxGeometry args={[0.2, 0.04, 0.45]} />
        <meshStandardMaterial color="#555" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* SD Card inserted */}
      <mesh position={[-0.12, 0, 0]}>
        <boxGeometry args={[0.15, 0.02, 0.38]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.6} />
      </mesh>
    </group>
  );
}

// Power LED
function PowerLED({ isOn }: { isOn: boolean }) {
  return (
    <group position={[-1.2, 0.1, -0.8]}>
      <mesh>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial
          color={isOn ? '#22c55e' : '#333'}
          emissive={isOn ? '#22c55e' : '#000'}
          emissiveIntensity={isOn ? 3 : 0}
          transparent
          opacity={0.9}
        />
      </mesh>
      {isOn && <pointLight color="#22c55e" intensity={0.5} distance={0.4} />}
    </group>
  );
}

// WiFi/BT Chip
function WirelessChip() {
  return (
    <group position={[0.8, 0.1, 0.6]}>
      <mesh>
        <boxGeometry args={[0.25, 0.04, 0.2]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Antenna trace */}
      <mesh position={[0.15, 0.03, 0]}>
        <boxGeometry args={[0.08, 0.01, 0.15]} />
        <meshStandardMaterial color="#c0a020" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// RAM Chip
function RAMChip({ boardType }: { boardType: BoardType }) {
  if (boardType === 'esp32') return null;
  return (
    <group position={[-0.5, 0.1, 0.4]}>
      <mesh>
        <boxGeometry args={[0.4, 0.04, 0.25]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.5} />
      </mesh>
      <Text position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.05} color="#555">
        4GB LPDDR4
      </Text>
    </group>
  );
}

// Board label text
function BoardLabel({ board }: { board: EmbeddedBoard }) {
  return (
    <group position={[0, 0.07, 0.9]}>
      <Text fontSize={0.1} color="#4ade80" anchorX="center">
        {board.name}
      </Text>
      <Text position={[0, -0.1, 0]} fontSize={0.06} color="#666" anchorX="center">
        {board.type === 'raspberry-pi' ? 'ARM Cortex-A72 • 4GB • CSI-2' :
          board.type === 'esp32' ? 'Xtensa LX6 • 520KB • OV2640' :
            'Custom ARM/RISC-V'}
      </Text>
    </group>
  );
}

export function Board3D({ board, onPinClick }: Board3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <PCB boardType={board.type} />
      <CPUChip boardType={board.type} cpuUsage={board.cpuUsage} />
      <GPIOPins board={board} onPinClick={onPinClick} side="left" />
      <GPIOPins board={board} onPinClick={onPinClick} side="right" />
      <USBPorts boardType={board.type} />
      <EthernetPort boardType={board.type} />
      <HDMIPort />
      <PowerPort />
      <SDCardSlot />
      <PowerLED isOn={board.cameraConnected} />
      <WirelessChip />
      <RAMChip boardType={board.type} />
      <BoardLabel board={board} />
    </group>
  );
}
