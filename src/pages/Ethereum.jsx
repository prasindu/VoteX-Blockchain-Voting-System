import React, { forwardRef } from 'react'
import { useGLTF } from '@react-three/drei'

export const Ethereum = forwardRef((props, ref) => {
  const { nodes } = useGLTF('/ethereum_logo_3d.glb')

  return (
    <group ref={ref} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group
          name="Sketchfab_model"
          rotation={[-Math.PI / 2, 0, 0]}
          scale={0.4}
        >
          <group name="root">
            <group name="GLTF_SceneRootNode" rotation={[Math.PI / 2, 0, 0]}>
              <group name="E_th_0">
                {/*  Apply plain gray MeshStandardMaterial */}
                <mesh
                  name="Object_4"
                  geometry={nodes.Object_4.geometry}
                >
                  <meshStandardMaterial
                    color="#ffffff"
                    metalness={0.7}
                    roughness={0.4}
                  />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
})

useGLTF.preload('/ethereum_logo_3d.glb')
