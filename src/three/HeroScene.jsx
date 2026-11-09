import { useCallback, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sparkles, ContactShadows } from '@react-three/drei'
import { Vector3 } from 'three'
import { Tshirt, Joggers } from './Apparel'
import { Studio } from './Studio'
import { useOnScreen } from './useOnScreen'
import { usePaused } from './pause'

const mouse = { x: 0, y: 0 }

// Fare ve kaydırmaya göre kamerayı yumuşakça hareket ettirir
function Rig() {
  const target = useRef(new Vector3())
  useFrame((state, dt) => {
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.2)
    target.current.set(mouse.x * 0.7, 0.35 + mouse.y * 0.35 - scroll * 0.6, 6.2 + scroll * 3)
    state.camera.position.lerp(target.current, 1 - Math.exp(-3 * dt))
    state.camera.lookAt(0, -0.1 - scroll * 0.4, 0)
  })
  return null
}

function Hero3D() {
  const { viewport } = useThree()
  const mobile = viewport.width < 6
  const hero = useRef()
  const orbit = useRef()

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.2)
    hero.current.rotation.y = -0.25 + Math.sin(t * 0.35) * 0.45 + scroll * 1.2
    hero.current.rotation.x = 0.05 + scroll * 0.4
    orbit.current.rotation.y -= dt * 0.12
  })

  return (
    <group position={[mobile ? 0.35 : 2.3, mobile ? -1.55 : 0.05, mobile ? -0.5 : 0]} scale={mobile ? 0.5 : 1}>
      <Float speed={1.6} rotationIntensity={0.25} floatIntensity={0.6}>
        <group ref={hero}>
          {/* Zafer Alayı: giriş tişörtü Pompeii kırmızısı, krem zeminde öne çıksın */}
          <Tshirt color="#b8322a" scale={0.95} position-y={-0.15} rotation-x={0.08} />
        </group>
      </Float>
      <group ref={orbit}>
        {/* yalnızca konfeksiyon: tişörtün yanında eşofman altı döner (anahtarlık ve vazo kaldırıldı) */}
        <Float speed={1.8} floatIntensity={1}>
          <Joggers color="#9aa3ab" scale={0.42} position={[-2.1, 0.5, -1.2]} rotation={[0.15, 0.5, 0.15]} />
        </Float>
      </group>
    </group>
  )
}

export default function HeroScene() {
  // aşağı kaydırınca ya da ürün penceresi açıkken sahne çizilmez
  const onScreen = useOnScreen(useCallback(() => document.querySelector('.hero'), []), '0px')
  const paused = usePaused()
  useEffect(() => {
    const onMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <Canvas frameloop={onScreen && !paused ? 'always' : 'never'} dpr={[1, 1.5]} camera={{ position: [0, 0.4, 6.2], fov: 35 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#f7f0e3']} />
      <fog attach="fog" args={['#f7f0e3', 7, 17]} />
      <Studio />
      <spotLight position={[0, 6, 2]} angle={0.35} penumbra={1} intensity={55} color="#fff4e0" />
      <Rig />
      <Hero3D />
      <Sparkles count={140} scale={[14, 7, 8]} size={2.2} speed={0.25} opacity={0.8} color="#d4a23a" />
      {/* Zemin: eskiden yansıyan zemin (MeshReflectorMaterial) ve bloom/gren/vinyet efektleri vardı.
          Sahneyi her karede iki kez çizip üstüne 5-6 tam ekran geçiş yapıyordu; kaydırırken en çok
          bu bölüm takılıyordu. Şimdi düz zemin + bir kez çizilen yumuşak gölge, vinyet CSS'te (.hero__shade) */}
      <mesh rotation-x={-Math.PI / 2} position-y={-1.9}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#ecd9b4" roughness={0.9} />
      </mesh>
      <ContactShadows frames={1} position={[1.9, -1.88, 0]} opacity={0.35} scale={9} blur={3} far={4} color="#5a3a22" />
    </Canvas>
  )
}
