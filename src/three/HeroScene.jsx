import { useCallback, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sparkles, MeshReflectorMaterial } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
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
    <Canvas frameloop={onScreen && !paused ? 'always' : 'never'} dpr={[1, 1.5]} camera={{ position: [0, 0.4, 6.2], fov: 35 }} gl={{ antialias: false, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#f7f0e3']} />
      <fog attach="fog" args={['#f7f0e3', 7, 17]} />
      <Studio />
      <spotLight position={[0, 6, 2]} angle={0.35} penumbra={1} intensity={55} color="#fff4e0" />
      <Rig />
      <Hero3D />
      <Sparkles count={140} scale={[14, 7, 8]} size={2.2} speed={0.25} opacity={0.8} color="#d4a23a" />
      <mesh rotation-x={-Math.PI / 2} position-y={-1.9}>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          blur={[300, 80]}
          resolution={512}
          mixBlur={1}
          mixStrength={3}
          roughness={1}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#dccaa9"
          metalness={0.3}
        />
      </mesh>
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={1.1} intensity={0.4} />
        <Noise opacity={0.04} />
        <Vignette offset={0.2} darkness={0.3} />
      </EffectComposer>
    </Canvas>
  )
}
