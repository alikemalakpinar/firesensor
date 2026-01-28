import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Building configuration - Matte Black Metal aesthetic
const BUILDING_CONFIG = {
  width: 12,
  height: 8,
  depth: 10,
  floors: 3,
  // Obsidian/Metal colors
  metalColor: 0x1a1a1a,
  edgeColor: 0xff4500, // Burnt orange for edges
  panelColor: 0x0a0a0a,
  glowColor: 0xff6b35, // Ember glow
};

/**
 * Building - Matte Black Metal Industrial Structure
 *
 * "Magma & Obsidian" aesthetic:
 * - Solid dark metal appearance (not wireframe)
 * - Subtle ember glow on edges
 * - Industrial, authoritative feel
 */
export function Building() {
  const groupRef = useRef();

  // Subtle rotation animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.03;
    }
  });

  const floorHeight = BUILDING_CONFIG.height / BUILDING_CONFIG.floors;

  return (
    <group ref={groupRef} position={[0, BUILDING_CONFIG.height / 2, 0]}>
      {/* Main building structure */}
      <MetalStructure
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

      {/* Edge glow lines */}
      <EdgeGlow
        width={BUILDING_CONFIG.width}
        height={BUILDING_CONFIG.height}
        depth={BUILDING_CONFIG.depth}
      />

      {/* Ground reference */}
      <IndustrialFloor />
    </group>
  );
}

/**
 * MetalStructure - Solid matte black metal building
 */
function MetalStructure({ width, height, depth }) {
  const meshRef = useRef();

  // Matte metal material
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BUILDING_CONFIG.metalColor,
        metalness: 0.8,
        roughness: 0.6,
        envMapIntensity: 0.3,
      }),
    []
  );

  return (
    <group>
      {/* Main building body - slightly smaller to show edges */}
      <mesh ref={meshRef} material={material} castShadow receiveShadow>
        <boxGeometry args={[width * 0.98, height * 0.98, depth * 0.98]} />
      </mesh>

      {/* Outer frame - darker */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={BUILDING_CONFIG.panelColor}
          metalness={0.9}
          roughness={0.4}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Vertical structural beams */}
      <StructuralBeams width={width} height={height} depth={depth} />
    </group>
  );
}

/**
 * StructuralBeams - Industrial support beams
 */
function StructuralBeams({ width, height, depth }) {
  const beamSize = 0.15;
  const hw = width / 2 - beamSize;
  const hd = depth / 2 - beamSize;

  const positions = [
    [-hw, 0, -hd],
    [hw, 0, -hd],
    [-hw, 0, hd],
    [hw, 0, hd],
  ];

  return (
    <group>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[beamSize * 2, height, beamSize * 2]} />
          <meshStandardMaterial
            color={0x2d2d2d}
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * EdgeGlow - Glowing edges like heated metal
 */
function EdgeGlow({ width, height, depth }) {
  const edgesRef = useRef();

  // Animate edge glow
  useFrame((state) => {
    if (edgesRef.current) {
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
      edgesRef.current.material.opacity = pulse;
    }
  });

  const edgesGeometry = useMemo(() => {
    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
    return new THREE.EdgesGeometry(boxGeometry);
  }, [width, height, depth]);

  return (
    <lineSegments ref={edgesRef} geometry={edgesGeometry}>
      <lineBasicMaterial
        color={BUILDING_CONFIG.edgeColor}
        transparent
        opacity={0.6}
        linewidth={2}
      />
    </lineSegments>
  );
}

/**
 * FloorPlane - Semi-transparent floor separator with ember tint
 */
function FloorPlane({ y, width, depth }) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width * 0.9, depth * 0.9]} />
      <meshBasicMaterial
        color={BUILDING_CONFIG.edgeColor}
        transparent
        opacity={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * IndustrialFloor - Ground reference with grid pattern
 */
function IndustrialFloor() {
  const gridRef = useRef();

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.material.opacity =
        0.2 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group position={[0, -BUILDING_CONFIG.height / 2 - 0.01, 0]}>
      {/* Grid helper with ember color */}
      <gridHelper
        ref={gridRef}
        args={[40, 40, BUILDING_CONFIG.edgeColor, 0x2d2d2d]}
      />

      {/* Ground plane for shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <shadowMaterial transparent opacity={0.4} />
      </mesh>

      {/* Radial glow on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[15, 64]} />
        <meshBasicMaterial
          color={BUILDING_CONFIG.glowColor}
          transparent
          opacity={0.03}
        />
      </mesh>
    </group>
  );
}

/**
 * EmberParticles - Floating ember particles for atmosphere
 */
export function EmberParticles({ count = 100 }) {
  const pointsRef = useRef();

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      // Color - orange to red gradient
      const t = Math.random();
      colors[i * 3] = 1; // R
      colors[i * 3 + 1] = 0.3 + t * 0.4; // G
      colors[i * 3 + 2] = t * 0.2; // B
    }

    return { positions, colors };
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      // Slow rotation
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01;

      // Float particles upward
      const positions = pointsRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += 0.003;
        if (positions[i * 3 + 1] > 15) {
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
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        transparent
        opacity={0.7}
        vertexColors
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default Building;
