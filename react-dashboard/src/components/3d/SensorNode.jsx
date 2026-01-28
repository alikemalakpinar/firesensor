import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSensorStore } from '../../stores/useSensorStore';

// Ember color palette for sensor nodes
const EMBER_COLORS = {
  normal: {
    core: new THREE.Color('#FF6B35'),      // Warm ember
    glow: new THREE.Color('#FF8C00'),      // Deep amber
    intensity: 1.5,
  },
  warning: {
    core: new THREE.Color('#FFBA08'),      // Warning yellow
    glow: new THREE.Color('#FF8C00'),      // Amber
    intensity: 2.5,
  },
  critical: {
    core: new THREE.Color('#FF0000'),      // Strobe red
    glow: new THREE.Color('#FFFFFF'),      // White hot
    intensity: 5,
  },
  offline: {
    core: new THREE.Color('#4A4A4A'),      // Warm grey
    glow: new THREE.Color('#2D2D2D'),      // Tungsten
    intensity: 0.3,
  },
};

/**
 * SensorNode - Pulsing Ember Sensor Representation
 *
 * "Magma & Obsidian" aesthetic:
 * - Normal: Dim warm orange glow (like a dying coal)
 * - Alert: Flares bright red/white (like ignited magnesium)
 * - Heavy bloom effect for that heated metal look
 */
export function SensorNode({ sensorId, position, onClick }) {
  const groupRef = useRef();
  const coreRef = useRef();
  const glowRef = useRef();
  const outerGlowRef = useRef();
  const lineRef = useRef();

  const sensor = useSensorStore((state) => state.sensors[sensorId]);
  const selectedSensor = useSensorStore((state) => state.selectedSensor);
  const selectSensor = useSensorStore((state) => state.selectSensor);

  const isSelected = selectedSensor === sensorId;
  const status = sensor?.status || 'normal';
  const colors = EMBER_COLORS[status] || EMBER_COLORS.normal;

  // Create materials with current colors
  const materials = useMemo(() => {
    return {
      core: new THREE.MeshStandardMaterial({
        color: colors.core,
        emissive: colors.core,
        emissiveIntensity: colors.intensity,
        metalness: 0.3,
        roughness: 0.4,
      }),
      glow: new THREE.MeshBasicMaterial({
        color: colors.glow,
        transparent: true,
        opacity: 0.6,
      }),
      outerGlow: new THREE.MeshBasicMaterial({
        color: colors.core,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
      }),
      line: new THREE.LineBasicMaterial({
        color: colors.core,
        transparent: true,
        opacity: 0.4,
      }),
    };
  }, [colors]);

  // Connection line geometry
  const lineGeometry = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -position.y + 0.5, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [position.y]);

  // Animation
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const isCritical = status === 'critical';
    const isWarning = status === 'warning';

    // Core ember pulse - breathing like a coal
    if (coreRef.current) {
      let pulseSpeed = 1.5;
      let pulseRange = 0.3;

      if (isCritical) {
        // Fast intense pulse for critical
        pulseSpeed = 8;
        pulseRange = 2;
      } else if (isWarning) {
        pulseSpeed = 3;
        pulseRange = 0.8;
      }

      const pulse = colors.intensity + Math.sin(time * pulseSpeed) * pulseRange;
      coreRef.current.material.emissiveIntensity = pulse;

      // Subtle scale breathing
      const breathe = 1 + Math.sin(time * pulseSpeed * 0.5) * 0.05;
      coreRef.current.scale.setScalar(breathe);
    }

    // Inner glow animation
    if (glowRef.current) {
      const glowPulse = isCritical
        ? 0.8 + Math.sin(time * 10) * 0.2
        : 0.4 + Math.sin(time * 2) * 0.2;
      glowRef.current.material.opacity = glowPulse;
      glowRef.current.rotation.y = time * 0.5;
    }

    // Outer glow for critical - white hot flash
    if (outerGlowRef.current) {
      if (isCritical) {
        const flash = 0.3 + Math.sin(time * 12) * 0.25;
        outerGlowRef.current.material.opacity = flash;
      } else {
        outerGlowRef.current.material.opacity = 0.1;
      }
    }

    // Connection line pulse for critical
    if (lineRef.current && isCritical) {
      const flash = 0.4 + Math.sin(time * 8) * 0.3;
      lineRef.current.material.opacity = flash;
    }

    // Selected state - larger scale
    if (groupRef.current) {
      const targetScale = isSelected ? 1.4 : 1;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

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
      {/* Core ember sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <primitive object={materials.core} attach="material" />
      </mesh>

      {/* Inner glow ring */}
      <mesh ref={glowRef}>
        <torusGeometry args={[0.45, 0.03, 16, 32]} />
        <primitive object={materials.glow} attach="material" />
      </mesh>

      {/* Outer glow sphere (for bloom) */}
      <mesh ref={outerGlowRef} scale={1.5}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <primitive object={materials.outerGlow} attach="material" />
      </mesh>

      {/* Connection line to floor */}
      <line ref={lineRef} geometry={lineGeometry}>
        <primitive object={materials.line} attach="material" />
      </line>

      {/* Point light for local illumination */}
      <pointLight
        color={status === 'critical' ? '#FF0000' : '#FF6B35'}
        intensity={status === 'critical' ? 4 : 1.5}
        distance={6}
        decay={2}
      />

      {/* HTML Tooltip */}
      {isSelected && (
        <Html
          position={[0, 0.8, 0]}
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none' }}
        >
          <div className="glass-tooltip">
            <div className="tooltip-header">
              <span className="tooltip-label">{sensor.label}</span>
              <span
                className="tooltip-status"
                style={{
                  color:
                    status === 'critical'
                      ? '#FF0000'
                      : status === 'warning'
                        ? '#FFBA08'
                        : '#FF8C00',
                }}
              >
                {status.toUpperCase()}
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
