import React from 'react';
import { OrbitControls, Environment, Float ,ContactShadows } from '@react-three/drei';
import { Boxx } from './Boxx';
import { Suspense } from 'react';

const Scene = () => {
  return (
    <>
       <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      <Suspense fallback={null}>
        <Boxx />
        <Environment preset="sunset" />
      </Suspense>

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.5}
        scale={10}
        blur={0.8}
        far={5}
      />

      <OrbitControls />
    </>
  );
};

export default Scene;
