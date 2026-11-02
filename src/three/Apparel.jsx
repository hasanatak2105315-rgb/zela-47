import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { CanvasTexture, Color, ExtrudeGeometry, Shape, SRGBColorSpace } from 'three'

// Kodla çizilmiş giyim ürünleri: kesim kalıbı gibi 2D bir şekil yumuşak kenarlarla kalınlaştırılır,
// göğse kendi tasarımımız olan baskı yazısı (canvas dokusu) eklenir.

const PI = Math.PI
const DEPTH = 0.16
const BEVEL = 0.07
const FRONT = DEPTH / 2 + BEVEL + 0.003

const extrude = (shape) => {
  const g = new ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: 0.06,
    bevelSegments: 5,
    curveSegments: 14
  })
  g.translate(0, 0, -DEPTH / 2)
  return g
}

// Sol yarının noktalarını verip sağını aynalayarak kalıp çizer (yaka oyuğu ve etek kavisli)
function pattern(half, { neckDip = 0.72, hem = -0.98, hemCurve = 0.04 } = {}) {
  const s = new Shape()
  const [first, ...rest] = half
  s.moveTo(-first[0], first[1])
  rest.forEach(([x, y]) => s.lineTo(-x, y))
  const [hx] = half[half.length - 1]
  s.quadraticCurveTo(0, hem - hemCurve, hx, hem)
  ;[...rest].reverse().forEach(([x, y]) => s.lineTo(x, y))
  s.lineTo(first[0], first[1])
  s.quadraticCurveTo(0, neckDip, -first[0], first[1])
  return s
}

const TEE = [[0.3, 1.0], [0.66, 0.9], [1.08, 0.5], [0.84, 0.24], [0.62, 0.42], [0.64, -0.98]]
const SWEAT = [[0.3, 1.0], [0.68, 0.9], [1.02, 0.45], [1.14, -0.62], [0.88, -0.66], [0.64, 0.36], [0.64, -0.92]]

const isLight = (hex) => new Color(hex).getHSL({}).l > 0.55
const shade = (hex, k) => '#' + new Color(hex).multiplyScalar(k).getHexString()

const Fabric = ({ color }) => <meshStandardMaterial color={color} roughness={0.92} metalness={0} />

// Baskı dokusu: italik marka yazısı + küçük logo satırı. Aynı yazı için tek doku üretilir
const prints = new Map()
export function printTexture(text, ink) {
  const key = text + ink
  if (prints.has(key)) return prints.get(key)
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  const draw = () => {
    const c = canvas.getContext('2d')
    c.clearRect(0, 0, 1024, 512)
    c.fillStyle = ink
    c.textAlign = 'center'
    c.font = 'italic 500 190px "Playfair Display", Georgia, serif'
    c.fillText(text, 512, 270, 960)
    c.fillRect(392, 320, 240, 5)
    c.font = '700 46px "Montserrat", sans-serif'
    if ('letterSpacing' in c) c.letterSpacing = '14px'
    c.fillText('VENI · VIDI · VICI', 512, 410, 960)
    tex.needsUpdate = true
  }
  draw()
  // Yazı tipleri sonradan yüklenirse doku yeniden çizilir
  document.fonts?.ready.then(draw)
  prints.set(key, tex)
  return tex
}

export function Print({ text, ink, width = 0.74, ...props }) {
  const map = useMemo(() => printTexture(text, ink), [text, ink])
  return (
    <mesh {...props}>
      <planeGeometry args={[width, width / 2]} />
      <meshStandardMaterial map={map} transparent roughness={0.8} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  )
}

const inkFor = (color) => (isLight(color) ? '#6e1a15' : '#f7e3b0')

// Yaka, kol ve etek ucundaki ribana
function Rib({ color, ...props }) {
  return (
    <mesh {...props}>
      <boxGeometry args={[1, 1, 1]} />
      <Fabric color={shade(color, 0.82)} />
    </mesh>
  )
}

function Collar({ color }) {
  return (
    <mesh position={[0, 1.0, 0.02]} rotation-z={PI} scale={[1, 0.5, 1]}>
      <torusGeometry args={[0.3, 0.045, 10, 32, PI]} />
      <Fabric color={shade(color, 0.82)} />
    </mesh>
  )
}

export function Tshirt({ color = '#f1ece2', print = 'Zela 47', ...props }) {
  const geo = useMemo(() => extrude(pattern(TEE)), [])
  return (
    <group {...props}>
      <mesh geometry={geo}>
        <Fabric color={color} />
      </mesh>
      <Collar color={color} />
      {print && <Print text={print} ink={inkFor(color)} position={[0, 0.38, FRONT]} />}
    </group>
  )
}

// Uzun kollu gövde: sweatshirt, kapüşonlu ve eşofman üstü bunu kullanır
function SweatBody({ color, print, printY = 0.36, zip, stripe }) {
  const geo = useMemo(() => extrude(pattern(SWEAT, { hem: -0.92 })), [])
  return (
    <>
      <mesh geometry={geo}>
        <Fabric color={color} />
      </mesh>
      <Collar color={color} />
      <Rib color={color} position={[0, -0.97, 0]} scale={[1.36, 0.14, 0.3]} />
      {[-1, 1].map((s) => (
        <Rib key={s} color={color} position={[s * 1.01, -0.69, 0]} rotation-z={s * 0.1} scale={[0.3, 0.13, 0.3]} />
      ))}
      {stripe &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * 1.05, -0.1, FRONT - 0.03]} rotation-z={s * 0.11}>
            <planeGeometry args={[0.05, 1.0]} />
            <meshStandardMaterial color={stripe} roughness={0.7} />
          </mesh>
        ))}
      {zip && (
        <mesh position={[0, -0.02, FRONT]}>
          <planeGeometry args={[0.025, 1.8]} />
          <meshStandardMaterial color="#c9ced3" metalness={0.8} roughness={0.3} />
        </mesh>
      )}
      {print && <Print text={print} ink={inkFor(color)} width={zip ? 0.36 : 0.74} position={[zip ? 0.3 : 0, printY, FRONT]} />}
    </>
  )
}

export function Sweatshirt({ color = '#7a2420', print = 'Est. 2026', ...props }) {
  return (
    <group {...props}>
      <SweatBody color={color} print={print} />
    </group>
  )
}

export function Hoodie({ color = '#f2a65a', print = 'Tokat', ...props }) {
  const dark = shade(color, 0.78)
  return (
    <group {...props}>
      <SweatBody color={color} print={print} printY={0.42} />
      {/* kapüşon yakanın arkasından görünür */}
      <mesh position={[0, 1.05, -0.12]} scale={[0.5, 0.42, 0.26]}>
        <sphereGeometry args={[1, 32, 20]} />
        <Fabric color={dark} />
      </mesh>
      <RoundedBox args={[0.92, 0.44, 0.06]} radius={0.03} smoothness={3} position={[0, -0.5, FRONT - 0.02]}>
        <Fabric color={shade(color, 0.94)} />
      </RoundedBox>
      {[-0.11, 0.11].map((x) => (
        <group key={x} position={[x, 0.64, FRONT + 0.01]}>
          <mesh>
            <cylinderGeometry args={[0.012, 0.012, 0.42, 8]} />
            <meshStandardMaterial color="#f5f1e8" roughness={0.8} />
          </mesh>
          <mesh position-y={-0.23}>
            <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
            <meshStandardMaterial color="#c9ced3" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function Joggers({ color = '#26323d', stripe = '#d4a23a', ...props }) {
  const geo = useMemo(() => {
    const s = new Shape()
    s.moveTo(-0.56, 1.0)
    s.lineTo(0.56, 1.0)
    s.lineTo(0.62, 0.2)
    s.lineTo(0.52, -0.92)
    s.lineTo(0.12, -0.92)
    s.lineTo(0.04, 0.06)
    s.quadraticCurveTo(0, 0.0, -0.04, 0.06)
    s.lineTo(-0.12, -0.92)
    s.lineTo(-0.52, -0.92)
    s.lineTo(-0.62, 0.2)
    s.lineTo(-0.56, 1.0)
    return extrude(s)
  }, [])
  return (
    <group {...props}>
      <mesh geometry={geo}>
        <Fabric color={color} />
      </mesh>
      <Rib color={color} position={[0, 0.98, 0]} scale={[1.2, 0.16, 0.3]} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Rib color={color} position={[s * 0.32, -0.97, 0]} scale={[0.44, 0.14, 0.3]} />
          <mesh position={[s * 0.53, -0.32, FRONT - 0.01]} rotation-z={s * -0.09}>
            <planeGeometry args={[0.05, 1.0]} />
            <meshStandardMaterial color={stripe} roughness={0.7} />
          </mesh>
        </group>
      ))}
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 0.78, FRONT + 0.01]} rotation-z={x * 1.5}>
          <cylinderGeometry args={[0.012, 0.012, 0.32, 8]} />
          <meshStandardMaterial color="#f5f1e8" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

// Eşofman takımı: fermuarlı üst önde, alt hafif arkada
export function Tracksuit({ color = '#1c2b4a', color2, print = 'TX', ...props }) {
  return (
    <group {...props}>
      <group position={[0.42, -0.12, -0.25]} rotation-y={-0.25} scale={0.82}>
        <Joggers color={color2 ?? color} stripe="#d4a23a" />
      </group>
      <group position={[-0.32, 0.12, 0.2]} rotation-y={0.18} scale={0.72}>
        <SweatBody color={color} print={print} zip stripe="#d4a23a" />
      </group>
    </group>
  )
}
