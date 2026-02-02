import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LIGHT_CONFIG = {
  width: 12,
  height: 8,
  depth: 10,
  floors: 3,
  bodyColor: 0xe8e8e4,
  frameColor: 0xd4d4d0,
  edgeColor: 0x2d7a6f,
  floorColor: 0x2d7a6f,
  beamColor: 0xc4c4c0,
  gridPrimary: 0x2d7a6f,
  gridSecondary: 0xd4d4d0,
};

const DARK_CONFIG = {
  width: 12,
  height: 8,
  depth: 10,
  floors: 3,
  bodyColor: 0x0a0a12,
  frameColor: 0x0f0f1a,
  edgeColor: 0x00f0ff,
  floorColor: 0x00f0ff,
  beamColor: 0x1a1a2e,
  gridPrimary: 0x00f0ff,
  gridSecondary: 0x1a1a2e,
};

export function Building({ isDark = false }) {
  const groupRef = useRef();
  const config = isDark ? DARK_CONFIG : LIGHT_CONFIG;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.03;
    }
  });

  const floorHeight = config.height / config.floors;

  return (
    <group ref={groupRef} position={[0, config.height / 2, 0]}>
      <MetalStructure
        width={config.width}
        height={config.height}
        depth={config.depth}
        config={config}
        isDark={isDark}
      />
      {Array.from({ length: config.floors - 1 }).map((_, i) => (
        <FloorPlane
          key={i}
          y={-config.height / 2 + floorHeight * (i + 1)}
          width={config.width}
          depth={config.depth}
          config={config}
          isDark={isDark}
        />
      ))}
      <EdgeGlow
        width={config.width}
        height={config.height}
        depth={config.depth}
        config={config}
        isDark={isDark}
      />
      <IndustrialFloor config={config} isDark={isDark} />
    </group>
  );
}

function MetalStructure({ width, height, depth, config, isDark }) {
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: config.bodyColor,
      metalness: isDark ? 0.6 : 0.1,
      roughness: isDark ? 0.3 : 0.8,
      envMapIntensity: isDark ? 1.5 : 0.5,
      ...(isDark ? { emissive: new THREE.Color(0x00f0ff), emissiveIntensity: 0.02 } : {}),
    }),
    [config.bodyColor, isDark]
  );

  return (
    <group>
      <mesh material={material} castShadow receiveShadow>
        <boxGeometry args={[width * 0.98, height * 0.98, depth * 0.98]} />
      </mesh>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={config.frameColor}
          metalness={isDark ? 0.4 : 0.2}
          roughness={isDark ? 0.4 : 0.7}
          transparent
          opacity={isDark ? 0.15 : 0.3}
        />
      </mesh>
      <StructuralBeams width={width} height={height} depth={depth} config={config} isDark={isDark} />
    </group>
  );
}

function StructuralBeams({ width, height, depth, config, isDark }) {
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
          <meshStandardMaterial
            color={config.beamColor}
            metalness={isDark ? 0.5 : 0.2}
            roughness={isDark ? 0.4 : 0.6}
            {...(isDark ? { emissive: new THREE.Color(0x00f0ff), emissiveIntensity: 0.05 } : {})}
          />
        </mesh>
      ))}
    </group>
  );
}

function EdgeGlow({ width, height, depth, config, isDark }) {
  const edgesGeometry = useMemo(() => {
    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
    return new THREE.EdgesGeometry(boxGeometry);
  }, [width, height, depth]);

  return (
    <lineSegments geometry={edgesGeometry}>
      <lineBasicMaterial
        color={config.edgeColor}
        transparent
        opacity={isDark ? 0.8 : 0.4}
        linewidth={1}
      />
    </lineSegments>
  );
}

function FloorPlane({ y, width, depth, config, isDark }) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width * 0.9, depth * 0.9]} />
      <meshBasicMaterial
        color={config.floorColor}
        transparent
        opacity={isDark ? 0.08 : 0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function IndustrialFloor({ config, isDark }) {
  return (
    <group position={[0, -config.height / 2 - 0.01, 0]}>
      <gridHelper args={[40, 40, config.gridPrimary, config.gridSecondary]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <shadowMaterial transparent opacity={isDark ? 0.4 : 0.15} />
      </mesh>
    </group>
  );
}

export function EmberParticles({ count = 50, isDark = false }) {
  const pointsRef = useRef();

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      if (isDark) {
        // Cyan/pink neon particles
        const usePink = Math.random() > 0.7;
        colors[i * 3] = usePink ? 1.0 : 0.0;
        colors[i * 3 + 1] = usePink ? 0.16 : 0.94;
        colors[i * 3 + 2] = usePink ? 0.43 : 1.0;
      } else {
        colors[i * 3] = 0.18;
        colors[i * 3 + 1] = 0.48;
        colors[i * 3 + 2] = 0.44;
      }
    }
    return { positions, colors };
  }, [count, isDark]);

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
      <pointsMaterial size={isDark ? 0.08 : 0.05} transparent opacity={isDark ? 0.6 : 0.3} vertexColors sizeAttenuation />
    </points>
  );
}

export default Building;
