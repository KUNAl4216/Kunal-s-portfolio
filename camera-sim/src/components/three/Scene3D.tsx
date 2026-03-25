import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// Surveillance scene — a 3D outdoor area with building, road, lamp, etc.

function Ground() {
  return (
    <group>
      {/* Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#2a5a2a" roughness={0.9} />
      </mesh>
      {/* Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[4, 30]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>
      {/* Road markings */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -12 + i * 3]}>
          <planeGeometry args={[0.12, 1.5]} />
          <meshStandardMaterial color="#cccc00" />
        </mesh>
      ))}
      {/* Sidewalk left */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[-2.8, 0.02, 0]}>
        <planeGeometry args={[1.6, 30]} />
        <meshStandardMaterial color="#777" roughness={0.9} />
      </mesh>
      {/* Sidewalk right */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[2.8, 0.02, 0]}>
        <planeGeometry args={[1.6, 30]} />
        <meshStandardMaterial color="#777" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Building({ position, width, height, depth, color }: {
  position: [number, number, number]; width: number; height: number; depth: number; color: string
}) {
  const windowRows = Math.floor(height / 1.2);
  const windowCols = Math.floor(width / 1);

  return (
    <group position={position}>
      {/* Building body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Roof edge */}
      <mesh position={[0, height + 0.05, 0]}>
        <boxGeometry args={[width + 0.1, 0.1, depth + 0.1]} />
        <meshStandardMaterial color="#444" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Windows */}
      {Array.from({ length: windowRows }).map((_, row) =>
        Array.from({ length: windowCols }).map((_, col) => {
          const isLit = Math.sin(row * 3 + col * 7) > -0.3;
          return (
            <mesh
              key={`${row}-${col}`}
              position={[
                -width / 2 + 0.5 + col * 1,
                0.8 + row * 1.2,
                depth / 2 + 0.01
              ]}
            >
              <planeGeometry args={[0.5, 0.7]} />
              <meshStandardMaterial
                color={isLit ? '#ffee88' : '#1a1a2a'}
                emissive={isLit ? '#ffcc44' : '#000'}
                emissiveIntensity={isLit ? 0.5 : 0}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

function StreetLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 4, 8]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.4, 3.8, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
        <meshStandardMaterial color="#555" metalness={0.6} />
      </mesh>
      {/* Light fixture */}
      <mesh position={[0.7, 3.9, 0]}>
        <boxGeometry args={[0.3, 0.08, 0.15]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Light bulb */}
      <mesh position={[0.7, 3.84, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#ffeecc" emissive="#ffcc66" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0.7, 3.8, 0]} color="#ffcc66" intensity={3} distance={8} castShadow />
      {/* Light cone */}
      <spotLight
        position={[0.7, 3.8, 0]}
        target-position={[0.7, 0, 0]}
        angle={0.6}
        penumbra={0.5}
        color="#ffcc66"
        intensity={2}
        distance={6}
      />
    </group>
  );
}

function Car({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.8, 0.5, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Roof */}
      <mesh position={[0.1, 0.8, 0]} castShadow>
        <boxGeometry args={[1, 0.35, 0.85]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Windows */}
      <mesh position={[0.1, 0.8, 0.43]}>
        <boxGeometry args={[0.95, 0.3, 0.01]} />
        <meshPhysicalMaterial color="#88ccff" transparent opacity={0.5} roughness={0} />
      </mesh>
      <mesh position={[0.1, 0.8, -0.43]}>
        <boxGeometry args={[0.95, 0.3, 0.01]} />
        <meshPhysicalMaterial color="#88ccff" transparent opacity={0.5} roughness={0} />
      </mesh>
      {/* Wheels */}
      {[[-0.55, 0.15, 0.5], [-0.55, 0.15, -0.5], [0.55, 0.15, 0.5], [0.55, 0.15, -0.5]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.08, 16]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
      ))}
      {/* Headlights */}
      <mesh position={[0.91, 0.4, 0.3]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffff88" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.91, 0.4, -0.3]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffff88" emissiveIntensity={1} />
      </mesh>
      {/* Taillights */}
      <mesh position={[-0.91, 0.4, 0.3]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.91, 0.4, -0.3]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function Person({ position, shirtColor }: { position: [number, number, number]; shirtColor: string }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      // Walking bob
      ref.current.position.y = position[1] + Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.05;
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Head */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ddb899" roughness={0.8} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.72, -0.02]}>
        <sphereGeometry args={[0.13, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.3, 0.45, 0.2]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.07, 0.85, 0]} castShadow>
        <boxGeometry args={[0.12, 0.5, 0.14]} />
        <meshStandardMaterial color="#2a2a4a" roughness={0.8} />
      </mesh>
      <mesh position={[0.07, 0.85, 0]} castShadow>
        <boxGeometry args={[0.12, 0.5, 0.14]} />
        <meshStandardMaterial color="#2a2a4a" roughness={0.8} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.22, 1.25, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.22, 1.25, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Shoes */}
      <mesh position={[-0.07, 0.58, 0.04]}>
        <boxGeometry args={[0.13, 0.06, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.07, 0.58, 0.04]}>
        <boxGeometry args={[0.13, 0.06, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

function SecurityCamera({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.4;
    }
  });

  return (
    <group position={position}>
      {/* Mount bracket */}
      <mesh position={[0, 0, -0.1]}>
        <boxGeometry args={[0.15, 0.15, 0.2]} />
        <meshStandardMaterial color="#444" metalness={0.5} />
      </mesh>
      {/* Camera body */}
      <group ref={ref}>
        <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.06, 0.3, 16]} />
          <meshStandardMaterial color="#eee" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Lens */}
        <mesh position={[0, 0, 0.32]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshPhysicalMaterial color="#112" transparent opacity={0.6} clearcoat={1} />
        </mesh>
        {/* Status LED */}
        <mesh position={[0, 0.07, 0.25]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  );
}

function Fence({ startX, endX, z }: { startX: number; endX: number; z: number }) {
  const posts = Math.floor((endX - startX) / 1.5);
  return (
    <group position={[0, 0, z]}>
      {/* Horizontal bars */}
      <mesh position={[(startX + endX) / 2, 0.5, 0]}>
        <boxGeometry args={[endX - startX, 0.04, 0.04]} />
        <meshStandardMaterial color="#666" metalness={0.5} />
      </mesh>
      <mesh position={[(startX + endX) / 2, 0.9, 0]}>
        <boxGeometry args={[endX - startX, 0.04, 0.04]} />
        <meshStandardMaterial color="#666" metalness={0.5} />
      </mesh>
      {/* Posts */}
      {Array.from({ length: posts + 1 }).map((_, i) => (
        <mesh key={i} position={[startX + i * 1.5, 0.5, 0]} castShadow>
          <boxGeometry args={[0.06, 1, 0.06]} />
          <meshStandardMaterial color="#555" metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.6, 8]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      {/* Foliage layers */}
      {[0, 0.4, 0.8].map((y, i) => (
        <mesh key={i} position={[0, 1.8 + y, 0]} castShadow>
          <sphereGeometry args={[0.6 - i * 0.12, 8, 8]} />
          <meshStandardMaterial color={`hsl(${120 + i * 15}, 50%, ${25 + i * 5}%)`} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function Scene3D() {
  return (
    <group>
      <Ground />

      {/* Buildings */}
      <Building position={[-7, 0, -5]} width={3} height={6} depth={3} color="#3a3540" />
      <Building position={[-7, 0, 2]} width={2.5} height={4} depth={2.5} color="#3a3a45" />
      <Building position={[7, 0, -3]} width={3.5} height={8} depth={3} color="#35353f" />
      <Building position={[7, 0, 4]} width={2} height={3.5} depth={2} color="#3d3840" />

      {/* Street lamps */}
      <StreetLamp position={[-3.5, 0, -4]} />
      <StreetLamp position={[-3.5, 0, 3]} />
      <StreetLamp position={[3.5, 0, -2]} />
      <StreetLamp position={[3.5, 0, 5]} />

      {/* Cars */}
      <Car position={[-0.8, 0, -3]} color="#cc2222" />
      <Car position={[0.8, 0, 2]} color="#2244aa" />

      {/* People */}
      <Person position={[-3, 0, -1]} shirtColor="#4444aa" />
      <Person position={[3.2, 0, 1.5]} shirtColor="#aa4444" />
      <Person position={[-2.5, 0, 4]} shirtColor="#44aa44" />

      {/* Security cameras */}
      <SecurityCamera position={[-6, 5.5, -5.5]} />
      <SecurityCamera position={[6, 7.5, -3.5]} />

      {/* Trees */}
      <Tree position={[-5, 0, 6]} />
      <Tree position={[5, 0, -6]} />
      <Tree position={[-4.5, 0, -7]} />
      <Tree position={[4, 0, 7]} />

      {/* Fences */}
      <Fence startX={-10} endX={-4} z={8} />
      <Fence startX={4} endX={10} z={8} />
      <Fence startX={-10} endX={-4} z={-8} />
      <Fence startX={4} endX={10} z={-8} />

      {/* Scene label */}
      <Text position={[0, 0.05, 10]} fontSize={0.3} color="#666" rotation={[-Math.PI / 2, 0, 0]}>
        SURVEILLANCE ZONE — cam::core++ ENGINE
      </Text>
    </group>
  );
}
