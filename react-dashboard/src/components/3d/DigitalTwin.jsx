import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Stars,
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

import { Building, ParticleField } from './Building';
import { SensorNodes } from './SensorNode';
import { useSensorStore } from '../../stores/useSensorStore';

/**
 * SceneLighting - Sets up the lighting for the scene
 */
function SceneLighting() {
  return (
    <>
      {/* Ambient light for base visibility */}
      <ambientLight intensity={0.2} color="#1a1a2e" />

      {/* Main directional light */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.5}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Accent lighting - Cyan from left */}
      <pointLight
        position={[-10, 10, 5]}
        intensity={2}
        color="#00F0FF"
        distance={30}
        decay={2}
      />

      {/* Accent lighting - Teal from right */}
      <pointLight
        position={[15, 5, -10]}
        intensity={1.5}
        color="#0F3D3E"
        distance={25}
        decay={2}
      />

      {/* Top-down subtle blue */}
      <pointLight
        position={[0, 15, 0]}
        intensity={0.8}
        color="#4a9eff"
        distance={20}
        decay={2}
      />

      {/* Rim light from behind */}
      <spotLight
        position={[0, 10, -15]}
        angle={0.5}
        penumbra={1}
        intensity={0.5}
        color="#00F0FF"
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

      // Animate camera to look at sensor
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
      minDistance={10}
      maxDistance={50}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.2}
      autoRotate={false}
      autoRotateSpeed={0.5}
      dampingFactor={0.05}
      enableDamping
      target={[0, 4, 0]}
    />
  );
}

/**
 * PostProcessing - Adds visual effects to the scene
 */
function PostProcessing() {
  const systemStatus = useSensorStore((state) => state.systemStatus);
  const isCritical = systemStatus === 'critical';

  return (
    <EffectComposer>
      {/* Bloom for glowing effects - THE KEY to neon aesthetics */}
      <Bloom
        intensity={1.5}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.8}
      />

      {/* Chromatic aberration for tech feel */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={isCritical ? [0.003, 0.003] : [0.001, 0.001]}
        radialModulation={false}
        modulationOffset={0.5}
      />

      {/* Vignette for cinematic look */}
      <VignetteEffect
        offset={0.3}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Subtle noise for film grain */}
      <Noise
        premultiply
        blendFunction={BlendFunction.OVERLAY}
        opacity={0.03}
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
        position={[20, 15, 20]}
        fov={50}
        near={0.1}
        far={1000}
      />

      {/* Camera controls */}
      <CameraController />

      {/* Lighting */}
      <SceneLighting />

      {/* Background stars */}
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Main building structure */}
      <Building />

      {/* Sensor nodes */}
      <SensorNodes onSensorClick={onSensorClick} />

      {/* Atmospheric particles */}
      <ParticleField count={150} />

      {/* Fog for depth */}
      <fog attach="fog" args={['#050510', 30, 80]} />
    </>
  );
}

/**
 * LoadingFallback - Displayed while 3D assets load
 */
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color="#00F0FF" wireframe />
    </mesh>
  );
}

/**
 * DigitalTwin - Main component that renders the 3D facility visualization
 *
 * Props:
 * - onSensorClick: Callback when a sensor node is clicked
 * - className: Additional CSS classes
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
        }}
        style={{ background: '#050505' }}
      >
        <color attach="background" args={['#050505']} />

        <Suspense fallback={<LoadingFallback />}>
          <Scene onSensorClick={onSensorClick} />
          <PostProcessing />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default DigitalTwin;
