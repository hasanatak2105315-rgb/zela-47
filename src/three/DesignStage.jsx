import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { Tshirt, SweatBody, FRONT } from './Apparel'
import { Studio } from './Studio'

// Tasarım stüdyosundaki canlı 3D önizleme: düzenleyicinin çizdiği tuvaller kumaşa doku olarak basılır.
// canvases: { front, back } tuvalleri, version: tasarım her değiştiğinde artar (doku yenilenir)

function Decal({ canvas, version, area, back }) {
  // Tuvalin boyutu değişirse (ilk çizim, ürün değişimi) doku yeniden kurulur: GPU'daki doku
  // ilk yüklendiği boyutta sabit kalır, büyüyen tuval eskisine sığmaz
  const dims = `${canvas.width}x${canvas.height}`
  const tex = useMemo(() => {
    const t = new CanvasTexture(canvas)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 8
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, dims])
  useEffect(() => {
    tex.needsUpdate = true
  }, [tex, version])
  useEffect(() => () => tex.dispose(), [tex])
  return (
    <mesh position={[back ? -area.x : area.x, area.y, back ? -FRONT : FRONT]} rotation-y={back ? Math.PI : 0}>
      <planeGeometry args={[area.w, area.h]} />
      <meshStandardMaterial map={tex} transparent roughness={0.85} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  )
}

// Seçilen yüze döner; sürükleyerek çevrilebilir
function Turntable({ side, drag, children }) {
  const ref = useRef()
  useFrame((state, dt) => {
    const target = (side === 'back' ? Math.PI : 0) + drag.current + Math.sin(state.clock.elapsedTime * 0.6) * 0.12
    ref.current.rotation.y += (target - ref.current.rotation.y) * (1 - Math.exp(-6 * dt))
  })
  return <group ref={ref}>{children}</group>
}

export default function DesignStage({ productId, product, color, canvases, version, side }) {
  const drag = useRef(0)
  const start = useRef(null)
  useEffect(() => {
    drag.current = 0
  }, [side])
  const garment =
    productId === 'esofman-takimi' ? <SweatBody color={color} zip stripe="#d4a23a" /> : <Tshirt color={color} print={null} />
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.1, 4.4], fov: 35 }}
      onPointerDown={(e) => (start.current = e.clientX - drag.current * 160)}
      onPointerMove={(e) => start.current !== null && (drag.current = (e.clientX - start.current) / 160)}
      onPointerUp={() => (start.current = null)}
      onPointerLeave={() => (start.current = null)}
    >
      <Studio />
      <Turntable side={side} drag={drag}>
        <group position-y={-0.02}>
          {garment}
          <Decal canvas={canvases.front} version={version} area={product.sides.front} />
          <Decal canvas={canvases.back} version={version} area={product.sides.back} back />
        </group>
      </Turntable>
      <ContactShadows frames={1} position={[0, -1.25, 0]} opacity={0.5} scale={5} blur={2.6} far={2} color="#2b1b14" />
    </Canvas>
  )
}
