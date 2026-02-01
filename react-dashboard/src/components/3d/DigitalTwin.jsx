import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import {
  EffectComposer, Bloom, Vignette as VignetteEffect,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

import { Building } from './Building';
import { SensorNodes } from './SensorNode';
import { useSensorStore } from '../../stores/useSensorStore';

function CleanLighting() {
  return (
    <>
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.8}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-8, 10, 5]} intensity={0.4} color="#E8F5F2" distance={30} decay={2} />
      <pointLight position={[10, 8, -8]} intensity={0.3} color="#FFF0E5" distance={25} decay={2} />
      <hemisphereLight intensity={0.3} color="#E8F5F2" groundColor="#F2F1EC" />
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
      minDistance={12}
      maxDistance={45}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.1}
      autoRotate={true}
      autoRotateSpeed={0.2}
      dampingFactor={0.05}
      enableDamping
      target={[0, 4, 0]}
    />
  );
}

function CleanPostProcessing() {
  return (
    <EffectComposer>
      <Bloom intensity={0.3} luminanceThreshold={0.6} luminanceSmoothing={0.9} mipmapBlur radius={0.6} />
      <VignetteEffect offset={0.3} darkness={0.3} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

function Scene({ onSensorClick }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[22, 14, 22]} fov={45} near={0.1} far={1000} />
      <CameraController />
      <CleanLighting />
      <Building />
      <SensorNodes onSensorClick={onSensorClick} />
      <fog attach="fog" args={['#F2F1EC', 30, 80]} />
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color="#2D7A6F" wireframe />
    </mesh>
  );
}

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
          toneMappingExposure: 1.4,
        }}
        style={{ background: '#F2F1EC' }}
      >
        <color attach="background" args={['#F2F1EC']} />
        <Suspense fallback={<LoadingFallback />}>
          <Scene onSensorClick={onSensorClick} />
          <CleanPostProcessing />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default DigitalTwin;
