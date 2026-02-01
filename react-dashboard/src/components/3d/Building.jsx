import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BUILDING_CONFIG = {
  width: 12,
  height: 8,
  depth: 10,
  floors: 3,
  bodyColor: 0xe8e8e4,
  frameColor: 0xd4d4d0,
  edgeColor: 0x2d7a6f,
  floorColor: 0x2d7a6f,
};

export function Building() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.03;
    }
  });

  const floorHeight = BUILDING_CONFIG.height / BUILDING_CONFIG.floors;

  return (
    <group ref={groupRef} position={[0, BUILDING_CONFIG.height / 2, 0]}>
      <MetalStructure
        width={BUILDING_CONFIG.width}
        height={BUILDING_CONFIG.height}
        depth={BUILDING_CONFIG.depth}
      />
      {Array.from({ length: BUILDING_CONFIG.floors - 1 }).map((_, i) => (
        <FloorPlane
          key={i}
          y={-BUILDING_CONFIG.height / 2 + floorHeight * (i + 1)}
          width={BUILDING_CONFIG.width}
          depth={BUILDING_CONFIG.depth}
        />
      ))}
      <EdgeGlow
        width={BUILDING_CONFIG.width}
        height={BUILDING_CONFIG.height}
        depth={BUILDING_CONFIG.depth}
      />
      <IndustrialFloor />
    </group>
  );
}

function MetalStructure({ width, height, depth }) {
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: BUILDING_CONFIG.bodyColor,
      metalness: 0.1,
      roughness: 0.8,
      envMapIntensity: 0.5,
    }),
    []
  );

  return (
    <group>
      <mesh material={material} castShadow receiveShadow>
        <boxGeometry args={[width * 0.98, height * 0.98, depth * 0.98]} />
      </mesh>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={BUILDING_CONFIG.frameColor}
          metalness={0.2}
          roughness={0.7}
          transparent
          opacity={0.3}
        />
      </mesh>
      <StructuralBeams width={width} height={height} depth={depth} />
    </group>
  );
}

function StructuralBeams({ width, height, depth }) {
  const beamSize = 0.15;
  const hw = width / 2 - beamSize;
  const hd = depth / 2 - beamSize;

  const positions = [
    [-hw, 0, -hd], [hw, 0, -hd], [-hw, 0, hd], [hw, 0, hd],
  ];

  return (
    <group>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[beamSize * 2, height, beamSize * 2]} />
          <meshStandardMaterial color={0xc4c4c0} metalness={0.2} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function EdgeGlow({ width, height, depth }) {
  const edgesGeometry = useMemo(() => {
    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
    return new THREE.EdgesGeometry(boxGeometry);
  }, [width, height, depth]);

  return (
    <lineSegments geometry={edgesGeometry}>
      <lineBasicMaterial color={BUILDING_CONFIG.edgeColor} transparent opacity={0.4} linewidth={1} />
    </lineSegments>
  );
}

function FloorPlane({ y, width, depth }) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width * 0.9, depth * 0.9]} />
      <meshBasicMaterial color={BUILDING_CONFIG.floorColor} transparent opacity={0.05} side={THREE.DoubleSide} />
    </mesh>
  );
}

function IndustrialFloor() {
  return (
    <group position={[0, -BUILDING_CONFIG.height / 2 - 0.01, 0]}>
      <gridHelper args={[40, 40, 0x2d7a6f, 0xd4d4d0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <shadowMaterial transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

export function EmberParticles({ count = 50 }) {
  const pointsRef = useRef();

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      colors[i * 3] = 0.18;
      colors[i * 3 + 1] = 0.48;
      colors[i * 3 + 2] = 0.44;
    }
    return { positions, colors };
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.005;
      const positions = pointsRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += 0.002;
        if (positions[i * 3 + 1] > 15) positions[i * 3 + 1] = 0;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={particles.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} transparent opacity={0.3} vertexColors sizeAttenuation />
    </points>
  );
}

export default Building;
