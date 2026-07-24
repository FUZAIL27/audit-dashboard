import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 800;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10 - 4;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.015;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#4CC9F0"
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  );
}

function WireframeGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.04;
  });

  return (
    <mesh ref={meshRef} position={[4.5, -1, -6]}>
      <icosahedronGeometry args={[2.2, 2]} />
      <meshBasicMaterial color="#2E7FA0" wireframe transparent opacity={0.25} />
    </mesh>
  );
}

/**
 * A quiet ambient 3D backdrop for the app shell — particle field + a single
 * wireframe globe, both slow-moving and low-opacity so they read as
 * atmosphere (a "live system" feel) rather than decoration competing with
 * the data. Pointer events are disabled so it never blocks interaction.
 */
export function AmbientScene() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <ParticleField />
        <WireframeGlobe />
      </Canvas>
    </div>
  );
}
