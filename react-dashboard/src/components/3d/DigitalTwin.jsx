import { Suspense, useRef, useEffect, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  PerspectiveCamera, Environment, ContactShadows, CameraControls,
} from '@react-three/drei';
import {
  EffectComposer, Bloom, Vignette as VignetteEffect,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

import { Building, EmberParticles } from './Building';
import { SensorNodes } from './SensorNode';
import { useSensorStore } from '../../stores/useSensorStore';

/* ═══════════════════════ Camera Controller with Sensor Zoom ═══════════════════════ */
function SmartCameraController() {
  const controlsRef = useRef();
  const cameraTarget = useSensorStore((state) => state.cameraTarget);
  const sensors = useSensorStore((state) => state.deviceSensors[state.activeDeviceId] || {});

  // Expose controls ref globally for external zoom triggers
  useEffect(() => {
    if (controlsRef.current) {
      window.__cameraControls = controlsRef.current;
    }
    return () => { window.__cameraControls = null; };
  }, []);

  // Zoom to sensor when cameraTarget changes
  useEffect(() => {
    if (cameraTarget && sensors[cameraTarget] && controlsRef.current) {
      const sensor = sensors[cameraTarget];
      const pos = sensor.position;
      // Smoothly move camera to look at sensor from nearby
      controlsRef.current.setLookAt(
        pos.x + 6, pos.y + 4, pos.z + 6,  // camera position
        pos.x, pos.y, pos.z,                // target
        true                                  // animate
      );
    }
  }, [cameraTarget, sensors]);

  return (
    <CameraControls
      ref={controlsRef}
      minDistance={8}
      maxDistance={55}
      minPolarAngle={Math.PI / 8}
      maxPolarAngle={Math.PI / 2.1}
      dollySpeed={0.5}
      truckSpeed={0.8}
      smoothTime={0.35}
    />
  );
}

/* ═══════════════════════ Lighting ═══════════════════════ */
function LightModeLighting() {
  return (
    <>
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight
        position={[18, 28, 15]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-12, 18, -10]} intensity={0.25} color="#E8F5F2" />
      <pointLight position={[-8, 14, 5]} intensity={0.4} color="#E8F5F2" distance={35} decay={2} />
      <hemisphereLight intensity={0.35} color="#E8F5F2" groundColor="#F2F1EC" />
    </>
  );
}

function DarkModeLighting() {
  return (
    <>
      <ambientLight intensity={0.06} color="#0a0a1a" />
      <directionalLight position={[12, 22, 12]} intensity={0.12} color="#1a1a3e" castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-far={50}
        shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
      <pointLight position={[-10, 14, 8]} intensity={1.4} color="#00F0FF" distance={40} decay={2} />
      <pointLight position={[14, 10, -12]} intensity={0.9} color="#FF2A6D" distance={35} decay={2} />
      <pointLight position={[0, -1, 0]} intensity={0.3} color="#00F0FF" distance={20} decay={2} />
      <hemisphereLight intensity={0.04} color="#00F0FF" groundColor="#FF2A6D" />
    </>
  );
}

/* ═══════════════════════ Post Processing ═══════════════════════ */
function LightPostProcessing() {
  return (
    <EffectComposer>
      <Bloom intensity={0.12} luminanceThreshold={0.75} luminanceSmoothing={0.9} mipmapBlur radius={0.4} />
      <VignetteEffect offset={0.2} darkness={0.15} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

function DarkPostProcessing() {
  return (
    <EffectComposer>
      <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.8} mipmapBlur radius={0.8} />
      <VignetteEffect offset={0.4} darkness={0.6} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

/* ═══════════════════════ Scene ═══════════════════════ */
function Scene({ onSensorClick, isDark }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[22, 16, 22]} fov={38} near={0.1} far={1000} />
      <SmartCameraController />

      {/* Lighting */}
      {isDark ? <DarkModeLighting /> : <LightModeLighting />}

      {/* Environment map for realistic reflections on glass */}
      <Environment preset={isDark ? 'night' : 'city'} background={false} />

      {/* Building */}
      <Building isDark={isDark} />

      {/* Contact shadows for grounding */}
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={isDark ? 0.3 : 0.4}
        scale={50}
        blur={2.5}
        far={12}
        resolution={512}
        color={isDark ? '#000000' : '#2D7A6F'}
      />

      {/* Particles */}
      <EmberParticles count={35} isDark={isDark} />

      {/* Sensor nodes */}
      <SensorNodes onSensorClick={onSensorClick} isDark={isDark} />

      {/* Fog */}
      <fog attach="fog" args={[isDark ? '#050508' : '#F2F1EC', isDark ? 50 : 40, isDark ? 110 : 100]} />
    </>
  );
}

/* ═══════════════════════ Loading Fallback ═══════════════════════ */
function LoadingFallback() {
  const theme = useSensorStore((state) => state.theme);
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color={theme === 'dark' ? '#00F0FF' : '#2D7A6F'} wireframe />
    </mesh>
  );
}

/* ═══════════════════════ Main DigitalTwin ═══════════════════════ */
export function DigitalTwin({ onSensorClick, className = '' }) {
  const theme = useSensorStore((state) => state.theme);
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#050508' : '#F2F1EC';

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isDark ? 1.0 : 1.4,
        }}
        style={{ background: bgColor }}
      >
        <color attach="background" args={[bgColor]} />
        <Suspense fallback={<LoadingFallback />}>
          <Scene onSensorClick={onSensorClick} isDark={isDark} />
          {isDark ? <DarkPostProcessing /> : <LightPostProcessing />}
        </Suspense>
      </Canvas>
    </div>
  );
}

export default DigitalTwin;
