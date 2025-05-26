// Boxx.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Edges } from '@react-three/drei';
import * as THREE from 'three';

export function Boxx(props) {
  const { nodes } = useGLTF('/boxx.glb');
  const meshRef = useRef();
  const cardRef = useRef();
  const edgesMaterialRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Rotate the box
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.3;
    }

    // Float & rotate the card
    if (cardRef.current) {
      cardRef.current.position.y = 1 + Math.sin(t * 2) * 0.1;
      cardRef.current.rotation.y = Math.sin(t) * 0.5;
    }

    // Pulse the blue edges
    if (edgesMaterialRef.current) {
      const pulse = 0.5 + Math.sin(t * 2) * 0.5; // ranges 0 to 1
      edgesMaterialRef.current.color.setRGB(0, pulse, pulse); // teal pulse
    }
  });

  return (
    <group {...props} dispose={null}>
      {/* Glowing 3D Voting Box - Purple Faces */}
      <mesh
        ref={meshRef}
        geometry={nodes.mesh_0.geometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#a855f7"              // Purple surface
          roughness={0.3}
          metalness={0.8}
          emissive="#b400ff"
          emissiveIntensity={1.5}
        />
        {/* Blue Glowing Pulsing Edges */}
        <Edges
          threshold={15}
          scale={1.01}
        >
          <meshBasicMaterial
            ref={edgesMaterialRef}
            color="#00ffff"
            toneMapped={false}
          />
        </Edges>
      </mesh>

      {/* Floating Fingerprint Card */}
      <mesh
        ref={cardRef}
        position={[0, 1.5, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.7, 1, 0.02]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#d946ef"
          emissiveIntensity={1.2}
          metalness={1}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload('/boxx.glb');
