import { useCallback, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { View, PerspectiveCamera, Float, ContactShadows, OrbitControls } from '@react-three/drei'
import { Model } from './Models'
import { Studio } from './Studio'
import { useOnScreen } from './useOnScreen'
import { usePaused, pauseBackground } from './pause'

// Ürün kartlarındaki küçük 3D sahne. Hepsi tek bir ortak Canvas üzerinde çizilir (performans için).
// hovered bir ref'tir: kartın üzerine gelmek React'te yeniden çizim yaptırmaz (takılmayı önler)
function Spinner({ hovered, children }) {
  const ref = useRef()
  useFrame((_, dt) => {
    const on = hovered.current
    const speed = on ? 1.6 : 0.35
    ref.current.rotation.y += dt * speed
    const s = on ? 1.12 : 1
    ref.current.scale.lerp({ x: s, y: s, z: s }, 1 - Math.exp(-8 * dt))
  })
  return <group ref={ref}>{children}</group>
}

// product: ürün kaydı (model tipi, giyimde renk ve baskı yazısı)
const look = (p) => ({ type: p.model, color: p.color, color2: p.color2, print: p.print })

// visible: kategori dışında kalan kart gizlenir ama silinmez; gizliyken çizilmez
export function CardView({ product, hovered, className, visible = true }) {
  return (
    <View className={className} visible={visible}>
      <PerspectiveCamera makeDefault position={[0, 0.2, 5]} fov={32} />
      <Studio intensity={0.9} />
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <Spinner hovered={hovered}>
          <Model {...look(product)} />
        </Spinner>
      </Float>
      {/* gölge bir kez çizilir; her karede çizmek tüm kartlarda sayfayı yavaşlatıyordu */}
      <ContactShadows frames={1} position={[0, -1.25, 0]} opacity={0.6} scale={5} blur={2.5} far={2} color="#000" />
    </View>
  )
}

// Sanal prova (manken) 09.11.2026'da kaldırıldı; manken kodu Mannequin.jsx içinde duruyor.

// Tüm ürün kartlarını çizen tek tuval. Koleksiyon ekranda değilken gizlenir ve hiç çizilmez;
// bir pencere açıkken son kare ekranda kalır ama yeni kare çizilmez
export function ViewsCanvas() {
  const onScreen = useOnScreen(useCallback(() => document.getElementById('koleksiyon'), []))
  const paused = usePaused()
  return (
    <Canvas
      className="views-canvas"
      frameloop={onScreen && !paused ? 'always' : 'never'}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', visibility: onScreen ? 'visible' : 'hidden' }}
    >
      <View.Port />
    </Canvas>
  )
}

// Ürün detay penceresindeki büyük, döndürülebilir 3D görünüm
export function ProductStage({ product }) {
  // pencere açıkken arkadaki sahneler durur
  useEffect(() => pauseBackground(), [])
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.3, 4.6], fov: 35 }}>
      <Studio />
      <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.4}>
        <Model {...look(product)} scale={1.15} />
      </Float>
      <ContactShadows position={[0, -1.4, 0]} opacity={0.7} scale={6} blur={2.4} far={2.5} color="#000" />
      <OrbitControls autoRotate autoRotateSpeed={1.2} enablePan={false} enableZoom={false} minPolarAngle={0.9} maxPolarAngle={2} />
    </Canvas>
  )
}
