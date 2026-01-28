import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSensorStore } from '../../stores/useSensorStore';

// Status colors
const STATUS_COLORS = {
  normal: new THREE.Color('#00F0FF'),    // Electric Cyan
  warning: new THREE.Color('#FFB30F'),   // Amber
  critical: new THREE.Color('#FF2A6D'),  // Neon Red
  offline: new THREE.Color('#6c757d'),   // Gray
};

/**
 * SensorNode - 3D representation of a sensor in the Digital Twin
 *
 * Features:
 * - Glowing core sphere
 * - Rotating outer ring
 * - Pulsing animation based on status
 * - Connection line to floor
 * - Interactive tooltip on hover
 */
export function SensorNode({ sensorId, position, onClick }) {
  const groupRef = useRef();
  const coreRef = useRef();
  const ringRef = useRef();
  const pulseRef = useRef();
  const lineRef = useRef();

  const sensor = useSensorStore((state) => state.sensors[sensorId]);
  const selectedSensor = useSensorStore((state) => state.selectedSensor);
  const selectSensor = useSensorStore((state) => state.selectSensor);

  const isSelected = selectedSensor === sensorId;
  const statusColor = STATUS_COLORS[sensor?.status || 'normal'];

  // Memoize materials
  const materials = useMemo(() => ({
    core: new THREE.MeshStandardMaterial({
      color: statusColor,
      emissive: statusColor,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9,
    }),
    ring: new THREE.MeshBasicMaterial({
      color: statusColor,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    }),
    pulse: new THREE.MeshBasicMaterial({
      color: statusColor,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    }),
    line: new THREE.LineBasicMaterial({
      color: statusColor,
      transparent: true,
      opacity: 0.4,
    }),
  }), [statusColor]);

  // Animation
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const isCritical = sensor?.status === 'critical';

    // Core glow pulse
    if (coreRef.current) {
      const pulseIntensity = isCritical
        ? 2 + Math.sin(time * 8) * 1.5 // Fast pulse for critical
        : 2 + Math.sin(time * 2) * 0.5; // Slow pulse for normal
      coreRef.current.material.emissiveIntensity = pulseIntensity;

      // Slight floating motion
      coreRef.current.position.y = Math.sin(time * 1.5) * 0.05;
    }

    // Rotating ring
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.5;
      ringRef.current.rotation.x = Math.sin(time * 0.3) * 0.2;
    }

    // Expanding pulse
    if (pulseRef.current) {
      const scale = 1 + Math.sin(time * 2) * 0.3;
      pulseRef.current.scale.set(scale, scale, 1);
      pulseRef.current.material.opacity = 0.3 * (1 - Math.sin(time * 2) * 0.5);
    }

    // Selected state - larger scale
    if (groupRef.current) {
      const targetScale = isSelected ? 1.3 : 1;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  // Connection line geometry
  const lineGeometry = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -position.y + 0.5, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [position.y]);

  if (!sensor) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    selectSensor(sensorId);
    onClick?.(sensorId);
  };

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      onClick={handleClick}
    >
      {/* Core sphere - main glowing element */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <primitive object={materials.core} attach="material" />
      </mesh>

      {/* Outer ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.4, 0.02, 16, 32]} />
        <primitive object={materials.ring} attach="material" />
      </mesh>

      {/* Pulse ring */}
      <mesh ref={pulseRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.5, 32]} />
        <primitive object={materials.pulse} attach="material" />
      </mesh>

      {/* Connection line to floor */}
      <line ref={lineRef} geometry={lineGeometry}>
        <primitive object={materials.line} attach="material" />
      </line>

      {/* Point light for local illumination */}
      <pointLight
        color={statusColor}
        intensity={sensor?.status === 'critical' ? 3 : 1}
        distance={5}
        decay={2}
      />

      {/* HTML Tooltip */}
      {isSelected && (
        <Html
          position={[0, 0.6, 0]}
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none' }}
        >
          <div className="glass-tooltip">
            <div className="tooltip-header">
              <span className="tooltip-label">{sensor.label}</span>
              <span
                className="tooltip-status"
                style={{ color: statusColor.getStyle() }}
              >
                {sensor.status.toUpperCase()}
              </span>
            </div>
            <div className="tooltip-value">
              <span className="value">{sensor.value.toFixed(1)}</span>
              <span className="unit">{sensor.unit}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * SensorNodes - Renders all sensor nodes in the scene
 */
export function SensorNodes({ onSensorClick }) {
  const sensors = useSensorStore((state) => state.sensors);

  return (
    <group>
      {Object.values(sensors).map((sensor) => (
        <SensorNode
          key={sensor.id}
          sensorId={sensor.id}
          position={sensor.position}
          onClick={onSensorClick}
        />
      ))}
    </group>
  );
}

export default SensorNode;
