import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

export function Box(props) {
  const { nodes } = useGLTF('/box.gltf');
  const meshRef = useRef();
  const cardRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.3;
    }

    if (cardRef.current) {
      cardRef.current.position.y = 1 + Math.sin(t * 2) * 0.1;
    }
  });

  return (
    <group {...props} dispose={null}>
      {/* Box */}
      <mesh ref={meshRef} geometry={nodes.mesh_0.geometry}>
        <meshStandardMaterial
          color="#0ff"
          roughness={0.3}
          metalness={0.8}
          emissive="#00ffff"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Animated Card (fingerprint card rising and falling) */}
      <mesh ref={cardRef} position={[0, 1, 0]}>
        <boxGeometry args={[0.7, 1, 0.02]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#c084fc"
          metalness={1}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload('/box.gltf');
