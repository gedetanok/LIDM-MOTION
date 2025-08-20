import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Bounds } from '@react-three/drei'

type Meta = { shape?: string; params?: Record<string, number> }

function Shape3D({ meta }: { meta: Meta }) {
  const p = meta?.params ?? {}
  switch (meta?.shape) {
    case 'cube':
      return (
        <mesh>
          <boxGeometry args={[p.s || 1, p.s || 1, p.s || 1]} />
          <meshStandardMaterial />
        </mesh>
      )
    case 'rect_prism':
      return (
        <mesh>
          <boxGeometry args={[p.l || 1, p.w || 1, p.h || 1]} />
          <meshStandardMaterial />
        </mesh>
      )
    case 'cylinder':
      return (
        <mesh>
          <cylinderGeometry args={[p.r || 1, p.r || 1, p.h || 1, 48]} />
          <meshStandardMaterial />
        </mesh>
      )
    case 'cone':
      return (
        <mesh>
          <coneGeometry args={[p.r || 1, p.h || 1, 48]} />
          <meshStandardMaterial />
        </mesh>
      )
    case 'sphere':
      return (
        <mesh>
          <sphereGeometry args={[p.r || 1, 48, 48]} />
          <meshStandardMaterial />
        </mesh>
      )
    default:
      return null
  }
}

export default function Viz3D({ meta }: { meta: Meta }) {
  return (
    <div className="h-[360px]">
      <Canvas
        camera={{ position: [3, 3, 3], fov: 50 }}
        frameloop="demand"
        dpr={[1, 1.75]}
        gl={{ antialias: false }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[6, 8, 6]} intensity={0.8} />
        {/* helpers supaya jelas kanvas hidup */}
        <axesHelper args={[4]} />
        <gridHelper args={[10, 20]} />
        {/* auto-fit bentuk ke kamera */}
        <Bounds fit clip observe margin={1.2}>
          <Shape3D meta={meta} />
        </Bounds>
        <OrbitControls makeDefault enableDamping />
      </Canvas>
    </div>
  )
}