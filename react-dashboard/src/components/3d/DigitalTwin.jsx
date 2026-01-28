import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette as VignetteEffect,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

import { Building, EmberParticles } from './Building';
import { SensorNodes } from './SensorNode';
import { useSensorStore } from '../../stores/useSensorStore';

/**
 * MagmaLighting - Warm industrial lighting setup
 *
 * "Magma & Obsidian" aesthetic:
 * - Warm amber/orange accent lights
 * - Deep shadows for dramatic effect
 * - Subtle rim lighting
 */
function MagmaLighting() {
  return (
    <>
      {/* Ambient - very low, dark scene */}
      <ambientLight intensity={0.15} color="#1a1210" />

      {/* Main directional - warm tinted */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.4}
        color="#FFE4C4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Left accent - burnt orange */}
      <pointLight
        position={[-12, 8, 5]}
        intensity={3}
        color="#FF4500"
        distance={25}
        decay={2}
      />

      {/* Right accent - deep amber */}
      <pointLight
        position={[15, 6, -8]}
        intensity={2}
        color="#FF8C00"
        distance={20}
        decay={2}
      />

      {/* Top-down subtle warm */}
      <pointLight
        position={[0, 15, 0]}
        intensity={1}
        color="#FF6B35"
        distance={25}
        decay={2}
      />

      {/* Rim light from behind - ember glow */}
      <spotLight
        position={[0, 8, -18]}
        angle={0.6}
        penumbra={1}
        intensity={1.5}
        color="#FF4500"
        distance={30}
      />

      {/* Ground bounce light */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={0.5}
        color="#DC2F02"
        distance={15}
        decay={2}
      />
    </>
  );
}

/**
 * CameraController - Handles camera movement and targets
 */
function CameraController() {
  const controlsRef = useRef();
  const { camera } = useThree();
  const cameraTarget = useSensorStore((state) => state.cameraTarget);
  const sensors = useSensorStore((state) => state.sensors);

  useEffect(() => {
    if (cameraTarget && sensors[cameraTarget]) {
      const sensor = sensors[cameraTarget];
      const targetPosition = new THREE.Vector3(
        sensor.position.x,
        sensor.position.y,
        sensor.position.z
      );

      if (controlsRef.current) {
        controlsRef.current.target.copy(targetPosition);
      }
    }
  }, [cameraTarget, sensors, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={12}
      maxDistance={45}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.1}
      autoRotate={true}
      autoRotateSpeed={0.3}
      dampingFactor={0.05}
      enableDamping
      target={[0, 4, 0]}
    />
  );
}

/**
 * MagmaPostProcessing - Heavy bloom for heated metal look
 */
function MagmaPostProcessing() {
  const systemStatus = useSensorStore((state) => state.systemStatus);
  const isCritical = systemStatus === 'critical';

  return (
    <EffectComposer>
      {/* Heavy bloom for that "glowing heat" effect */}
      <Bloom
        intensity={isCritical ? 2.5 : 1.8}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.85}
      />

      {/* Chromatic aberration - stronger for critical */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={isCritical ? [0.004, 0.004] : [0.0015, 0.0015]}
        radialModulation={true}
        modulationOffset={0.3}
      />

      {/* Dark vignette for cinematic feel */}
      <VignetteEffect
        offset={0.35}
        darkness={0.8}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Film grain */}
      <Noise
        premultiply
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={0.04}
      />
    </EffectComposer>
  );
}

/**
 * Scene - The main 3D scene content
 */
function Scene({ onSensorClick }) {
  return (
    <>
      {/* Camera setup */}
      <PerspectiveCamera
        makeDefault
        position={[22, 14, 22]}
        fov={45}
        near={0.1}
        far={1000}
      />

      {/* Camera controls */}
      <CameraController />

      {/* Magma lighting */}
      <MagmaLighting />

      {/* Main building structure */}
      <Building />

      {/* Sensor nodes */}
      <SensorNodes onSensorClick={onSensorClick} />

      {/* Floating ember particles */}
      <EmberParticles count={80} />

      {/* Dark fog for depth */}
      <fog attach="fog" args={['#0A0A0A', 25, 70]} />
    </>
  );
}

/**
 * LoadingFallback - Ember-colored loading indicator
 */
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color="#FF4500" wireframe />
    </mesh>
  );
}

/**
 * DigitalTwin - Main component that renders the 3D facility visualization
 *
 * "Magma & Obsidian" theme with:
 * - Matte black metal building
 * - Pulsing ember sensor nodes
 * - Heavy bloom post-processing
 * - Warm industrial lighting
 */
export function DigitalTwin({ onSensorClick, className = '' }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ background: '#0A0A0A' }}
      >
        <color attach="background" args={['#0A0A0A']} />

        <Suspense fallback={<LoadingFallback />}>
          <Scene onSensorClick={onSensorClick} />
          <MagmaPostProcessing />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default DigitalTwin;
