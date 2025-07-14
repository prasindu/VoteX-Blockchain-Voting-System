import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Ethereum } from './Ethereum'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

const RotatingModel = () => {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y += 0.008
      ref.current.position.y = 0.1 * Math.sin(clock.getElapsedTime() * 1.5)
    }
  })
  return <Ethereum ref={ref} scale={1.1} />
}

const Scene = () => {
  return (
    <div style={{ width: '100%', height: '600px', background: '#000000' }}>
      <Canvas camera={{ position: [0, 1, 3], fov: 45 }} shadows gl={{ antialias: true }}>
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[2, 2, 2]}
          intensity={1.1}
          color="#00ffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={10}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        <pointLight position={[-2, 1, -2]} intensity={0.4} color="#00ffff" />
       <mesh position={[0, 0, 0]}>
 
  <meshStandardMaterial
    color="#00ffff"
    emissive="#00ffff"
    emissiveIntensity={2}
    roughness={0.4}
    metalness={0.8}
    transparent
    opacity={0.15}
  />
</mesh>

        <RotatingModel />
        <ContactShadows position={[0, -1, 0]} opacity={0.1} scale={3} blur={2} far={4} color="#00ffff" />
        <OrbitControls enableZoom={false} />
        {/* <EffectComposer>
          <Bloom luminanceThreshold={0} luminanceSmoothing={0.3} intensity={1.3} height={300} />
        </EffectComposer> */}
      </Canvas>
    </div>
  )
}

export default Scene
