import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'

function AxesAndGrid() {
  const axes = useMemo(() => new THREE.AxesHelper(4), [])
  const grid = useMemo(() => new THREE.GridHelper(20, 20), [])
  // position grid on XZ plane
  ;(grid.rotation as any).x = -Math.PI / 2
  return (
    <group>
      {/* axes helper */}
      <primitive object={axes} />
      {/* grid helper */}
      <primitive object={grid} />
      {/* axis labels */}
      <Text position={[4.5, 0, 0]} fontSize={0.4} color="#334155">x</Text>
      <Text position={[0, 4.5, 0]} fontSize={0.4} color="#334155">y</Text>
      <Text position={[0, 0, 4.5]} fontSize={0.4} color="#334155">z</Text>
    </group>
  )
}

function Shape3D({ meta }: { meta: any }) {
  const p = meta.params || {}
  switch (meta.shape) {
    case 'cube':
      return (
        <mesh>
          <boxGeometry args={[p.s || 2, p.s || 2, p.s || 2]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      )
    case 'rect_prism':
      return (
        <mesh>
          <boxGeometry args={[p.l || 3, p.w || 2, p.h || 2]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      )
    case 'cylinder':
      return (
        <mesh>
          <cylinderGeometry args={[p.r || 1.5, p.r || 1.5, p.h || 3, 48]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      )
    case 'cone':
      return (
        <mesh>
          <coneGeometry args={[p.r || 1.5, p.h || 3, 48]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      )
    case 'sphere':
      return (
        <mesh>
          <sphereGeometry args={[p.r || 1.8, 48, 48]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      )
    default:
      return null
  }
}

export default function Graph3D({ meta }: { meta: any }) {
  if (!meta) return null
  return (
    <div className="h-[360px]">
      <Canvas
        dpr={[1, 1.75]}
        frameloop="demand"
        gl={{ antialias: false }}
        camera={{ position: [4, 4, 6], fov: 55 }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[6, 8, 6]} intensity={0.8} />
        <AxesAndGrid />
        <Shape3D meta={meta} />
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  )
}