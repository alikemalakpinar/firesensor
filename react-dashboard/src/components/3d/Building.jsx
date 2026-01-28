import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Building configuration
const BUILDING_CONFIG = {
  width: 12,
  height: 8,
  depth: 10,
  floors: 3,
  wireframeColor: 0x0f3d3e,
  glassColor: 0x00f0ff,
  edgeColor: 0x00f0ff,
};

/**
 * Building - A futuristic wireframe building for the Digital Twin
 *
 * Features:
 * - Procedural wireframe structure
 * - Glass-like semi-transparent panels
 * - Floor separators
 * - Edge glow effect
 * - Subtle rotation animation
 */
export function Building() {
  const groupRef = useRef();
  const wireframeRef = useRef();

  // Subtle rotation animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  // Floor height calculation
  const floorHeight = BUILDING_CONFIG.height / BUILDING_CONFIG.floors;

  return (
    <group ref={groupRef} position={[0, BUILDING_CONFIG.height / 2, 0]}>
      {/* Main wireframe structure */}
      <WireframeBox
        width={BUILDING_CONFIG.width}
        height={BUILDING_CONFIG.height}
        depth={BUILDING_CONFIG.depth}
      />

      {/* Floor separators */}
      {Array.from({ length: BUILDING_CONFIG.floors - 1 }).map((_, i) => (
        <FloorPlane
          key={i}
          y={-BUILDING_CONFIG.height / 2 + floorHeight * (i + 1)}
          width={BUILDING_CONFIG.width}
          depth={BUILDING_CONFIG.depth}
        />
      ))}

      {/* Glass panels */}
      <GlassPanels
        width={BUILDING_CONFIG.width}
        height={BUILDING_CONFIG.height}
        depth={BUILDING_CONFIG.depth}
      />

      {/* Ground reference grid */}
      <GridFloor />
    </group>
  );
}

/**
 * WireframeBox - Creates a wireframe box structure
 */
function WireframeBox({ width, height, depth }) {
  const edgesRef = useRef();

  // Create box edges geometry
  const edgesGeometry = useMemo(() => {
    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
    return new THREE.EdgesGeometry(boxGeometry);
  }, [width, height, depth]);

  useFrame((state) => {
    if (edgesRef.current) {
      // Subtle glow pulsing
      edgesRef.current.material.opacity = 0.4 + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <>
      {/* Primary edges */}
      <lineSegments ref={edgesRef} geometry={edgesGeometry}>
        <lineBasicMaterial
          color={BUILDING_CONFIG.edgeColor}
          transparent
          opacity={0.5}
        />
      </lineSegments>

      {/* Inner structure lines */}
      <InnerStructure width={width} height={height} depth={depth} />
    </>
  );
}

/**
 * InnerStructure - Creates internal structural elements
 */
function InnerStructure({ width, height, depth }) {
  const lines = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const points = [];

    // Vertical columns at corners
    const hw = width / 2;
    const hh = height / 2;
    const hd = depth / 2;

    // Inner columns
    const innerOffset = 0.3;
    const corners = [
      [-hw + innerOffset, -hw + innerOffset],
      [hw - innerOffset, -hw + innerOffset],
      [-hw + innerOffset, hw - innerOffset],
      [hw - innerOffset, hw - innerOffset],
    ];

    corners.forEach(([x, z]) => {
      points.push(new THREE.Vector3(x, -hh, z));
      points.push(new THREE.Vector3(x, hh, z));
    });

    // Cross braces
    const floorCount = 3;
    const floorHeight = height / floorCount;
    for (let i = 0; i < floorCount; i++) {
      const y = -hh + floorHeight * i + floorHeight / 2;
      points.push(new THREE.Vector3(-hw, y, -hd));
      points.push(new THREE.Vector3(hw, y, hd));
      points.push(new THREE.Vector3(hw, y, -hd));
      points.push(new THREE.Vector3(-hw, y, hd));
    }

    geometry.setFromPoints(points);
    return geometry;
  }, [width, height, depth]);

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial
        color={BUILDING_CONFIG.wireframeColor}
        transparent
        opacity={0.3}
      />
    </lineSegments>
  );
}

/**
 * FloorPlane - Semi-transparent floor separator
 */
function FloorPlane({ y, width, depth }) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width * 0.95, depth * 0.95]} />
      <meshBasicMaterial
        color={BUILDING_CONFIG.wireframeColor}
        transparent
        opacity={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * GlassPanels - Creates glass-like wall panels
 */
function GlassPanels({ width, height, depth }) {
  const hw = width / 2;
  const hd = depth / 2;

  const panels = [
    { position: [0, 0, hd], rotation: [0, 0, 0], size: [width, height] },
    { position: [0, 0, -hd], rotation: [0, Math.PI, 0], size: [width, height] },
    { position: [hw, 0, 0], rotation: [0, Math.PI / 2, 0], size: [depth, height] },
    { position: [-hw, 0, 0], rotation: [0, -Math.PI / 2, 0], size: [depth, height] },
  ];

  return (
    <group>
      {panels.map((panel, i) => (
        <mesh
          key={i}
          position={panel.position}
          rotation={panel.rotation}
        >
          <planeGeometry args={panel.size} />
          <meshStandardMaterial
            color={BUILDING_CONFIG.glassColor}
            transparent
            opacity={0.03}
            side={THREE.DoubleSide}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * GridFloor - Reference grid on the ground
 */
function GridFloor() {
  const gridRef = useRef();

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.material.opacity =
        0.15 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group position={[0, -BUILDING_CONFIG.height / 2 - 0.01, 0]}>
      {/* Main grid */}
      <gridHelper
        ref={gridRef}
        args={[30, 30, BUILDING_CONFIG.edgeColor, BUILDING_CONFIG.wireframeColor]}
      />

      {/* Ground plane for receiving shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <shadowMaterial transparent opacity={0.3} />
      </mesh>

      {/* Radial gradient floor effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[20, 64]} />
        <meshBasicMaterial
          color={BUILDING_CONFIG.edgeColor}
          transparent
          opacity={0.05}
        />
      </mesh>
    </group>
  );
}

/**
 * ParticleField - Floating particles for atmosphere
 */
export function ParticleField({ count = 200 }) {
  const pointsRef = useRef();

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;

      // Animate particles floating up
      const positions = pointsRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += 0.002;
        if (positions[i * 3 + 1] > 20) {
          positions[i * 3 + 1] = 0;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={BUILDING_CONFIG.edgeColor}
        size={0.05}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export default Building;
