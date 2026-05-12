'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment, ContactShadows } from '@react-three/drei';
import { useRef, Suspense } from 'react';
import * as THREE from 'three';

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.18;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.25;

      const x = state.pointer.x;
      const y = state.pointer.y;
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, x * 1.6, 0.08);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, y * 1.6, 0.08);
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={1.1} floatIntensity={1.6}>
      <mesh ref={meshRef} scale={2.6}>
        <sphereGeometry args={[1, 96, 96]} />
        <MeshDistortMaterial
          color="#d4af37"
          attach="material"
          distort={0.35}
          speed={1.6}
          roughness={0.15}
          metalness={1}
          emissive="#3a2b08"
          emissiveIntensity={0.35}
        />
      </mesh>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 -z-10 h-screen w-full">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <directionalLight position={[10, 10, 5]} intensity={1.1} color="#fdf0c4" />
          <pointLight position={[-6, -4, -6]} intensity={0.6} color="#b8902b" />

          <AnimatedSphere />

          <ContactShadows
            position={[0, -3.5, 0]}
            opacity={0.55}
            scale={22}
            blur={2.4}
            far={4.5}
          />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
}
