import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import {
  EffectComposer, Bloom, Vignette as VignetteEffect,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

import { Building, EmberParticles } from './Building';
import { SensorNodes } from './SensorNode';
import { useSensorStore } from '../../stores/useSensorStore';

function LightModeLighting() {
  return (
    <>
      <ambientLight intensity={0.7} color="#ffffff" />
      <directionalLight
        position={[15, 25, 12]}
        intensity={1.0}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-10, 15, -8]} intensity={0.3} color="#E8F5F2" />
      <pointLight position={[-8, 12, 5]} intensity={0.5} color="#E8F5F2" distance={35} decay={2} />
      <pointLight position={[10, 8, -8]} intensity={0.3} color="#FFF0E5" distance={30} decay={2} />
      <hemisphereLight intensity={0.4} color="#E8F5F2" groundColor="#F2F1EC" />
    </>
  );
}

function DarkModeLighting() {
  return (
    <>
      <ambientLight intensity={0.08} color="#0a0a1a" />
      <directionalLight position={[10, 20, 10]} intensity={0.15} color="#1a1a3e" castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-far={50}
        shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
      <pointLight position={[-10, 12, 8]} intensity={1.2} color="#00F0FF" distance={40} decay={2} />
      <pointLight position={[12, 8, -10]} intensity={0.8} color="#FF2A6D" distance={35} decay={2} />
      <pointLight position={[0, -2, 0]} intensity={0.4} color="#00F0FF" distance={20} decay={2} />
      <hemisphereLight intensity={0.05} color="#00F0FF" groundColor="#FF2A6D" />
    </>
  );
}

function CameraController() {
  const controlsRef = useRef();
  const { camera } = useThree();
  const cameraTarget = useSensorStore((state) => state.cameraTarget);
  const sensors = useSensorStore((state) => state.deviceSensors[state.activeDeviceId] || {});

  useEffect(() => {
    if (cameraTarget && sensors[cameraTarget]) {
      const sensor = sensors[cameraTarget];
      const targetPosition = new THREE.Vector3(sensor.position.x, sensor.position.y, sensor.position.z);
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
      autoRotate={true}
      autoRotateSpeed={0.15}
      dampingFactor={0.05}
      enableDamping
      target={[0, 3, 0]}
    />
  );
}

function LightPostProcessing() {
  return (
    <EffectComposer>
      <Bloom intensity={0.15} luminanceThreshold={0.7} luminanceSmoothing={0.9} mipmapBlur radius={0.5} />
      <VignetteEffect offset={0.25} darkness={0.2} blendFunction={BlendFunction.NORMAL} />
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

function Scene({ onSensorClick, isDark }) {
  return (
    <>
      {/* Isometric-ish camera angle matching reference image */}
      <PerspectiveCamera makeDefault position={[20, 16, 20]} fov={40} near={0.1} far={1000} />
      <CameraController />
      {isDark ? <DarkModeLighting /> : <LightModeLighting />}
      <Building isDark={isDark} />
      <EmberParticles count={40} isDark={isDark} />
      <SensorNodes onSensorClick={onSensorClick} isDark={isDark} />
      <fog attach="fog" args={[isDark ? '#050508' : '#F2F1EC', isDark ? 45 : 35, isDark ? 100 : 90]} />
    </>
  );
}

function LoadingFallback() {
  const theme = useSensorStore((state) => state.theme);
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color={theme === 'dark' ? '#00F0FF' : '#2D7A6F'} wireframe />
    </mesh>
  );
}

export function DigitalTwin({ onSensorClick, className = '' }) {
  const theme = useSensorStore((state) => state.theme);
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#050508' : '#F2F1EC';

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
          toneMappingExposure: isDark ? 1.0 : 1.5,
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
