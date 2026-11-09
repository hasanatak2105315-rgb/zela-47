// Tasarım stüdyosu: ürünler, baskı alanları, yazı tipleri, mürekkep renkleri, hazır grafikler
// ve tasarımı tuvale (baskı dosyası / 3D doku) çizen ortak kod.
import { TEE, SWEAT } from './patterns'

// Baskı alanı: kalıp koordinatında merkez (x, y), genişlik/yükseklik (w, h) ve gerçek genişlik (cm).
// Katmanlar alanın içinde 0-1 arası oranlarla saklanır, böylece aynı tasarım ekranda, 3D'de ve
// baskı dosyasında aynı yerde durur.
export const DESIGN_PRODUCTS = {
  'baskili-tisort': {
    pattern: TEE,
    hem: -0.98,
    sides: {
      front: { label: 'Ön', x: 0, y: 0.2, w: 0.84, h: 1.12, cm: 30 },
      back: { label: 'Arka', x: 0, y: 0.2, w: 0.84, h: 1.12, cm: 30 }
    }
  },
  'esofman-takimi': {
    pattern: SWEAT,
    hem: -0.92,
    zip: true,
    sides: {
      // fermuar ortada olduğu için önde yalnızca sol göğüs (giyenin solu, bakanın sağı)
      front: { label: 'Sol göğüs', x: 0.32, y: 0.4, w: 0.4, h: 0.4, cm: 10 },
      back: { label: 'Sırt', x: 0, y: 0.12, w: 0.9, h: 1.2, cm: 32 }
    }
  }
}

export const SIDES = ['front', 'back']

// Baskı dosyası çözünürlüğü: alan genişliği başına piksel (ör. 30 cm → 2400 px ≈ 200 dpi)
export const EXPORT_PX = 2400
// Görsel bu çözünürlüğün altına düşerse "bulanık basılabilir" uyarısı verilir
export const MIN_DPI = 120

export const FONTS = [
  { key: 'montserrat', label: 'Kalın', css: '900 1em "Montserrat", Arial, sans-serif' },
  { key: 'anton', label: 'Sokak', css: '400 1em "Anton", Impact, sans-serif', upper: true },
  { key: 'playfair', label: 'Zarif', css: 'italic 500 1em "Playfair Display", Georgia, serif' },
  { key: 'caveat', label: 'El yazısı', css: '700 1em "Caveat", "Segoe Script", cursive' },
  { key: 'mono', label: 'Daktilo', css: '700 1em "Space Mono", "Courier New", monospace' }
]
// Stüdyoda ek olarak yüklenen yazı tipleri (ana sayfayı yavaşlatmasın diye yalnızca burada)
export const EXTRA_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Space+Mono:wght@700&display=swap'

export const INKS = [
  ['Beyaz', '#ffffff'],
  ['Krem', '#f7e3b0'],
  ['Siyah', '#1b1512'],
  ['Pompeii kırmızısı', '#b8322a'],
  ['Altın', '#d4a23a'],
  ['Lacivert', '#24375e'],
  ['Zeytin', '#5b6b2f'],
  ['Pembe', '#e58fa3']
]

// Hazır grafikler: renklendirilebilir SVG (currentColor yerine seçilen mürekkep rengi yazılır)
export const CLIPART = [
  {
    key: 'laurel',
    label: 'Defne çelengi',
    ratio: 1,
    svg: (() => {
      // sol dal: alttan (250°) yukarıya (125°) doğru yapraklar; sağ dal aynası
      const leaves = []
      for (let i = 0; i < 9; i++) {
        const deg = 250 - i * 15.5
        const a = (deg * Math.PI) / 180
        for (const [r, tilt] of [[33, -32], [43, 32]]) {
          const x = 50 + Math.cos(a) * r
          const y = 52 - Math.sin(a) * r
          const rot = 180 - deg + tilt
          const size = 1 - i * 0.035
          leaves.push([x, y, rot, size])
        }
      }
      const el = ([x, y, rot, k], m) =>
        `<ellipse cx="${(m ? 100 - x : x).toFixed(1)}" cy="${y.toFixed(1)}" rx="${(3.6 * k).toFixed(1)}" ry="${(8.4 * k).toFixed(1)}" transform="rotate(${(m ? -rot : rot).toFixed(0)} ${(m ? 100 - x : x).toFixed(1)} ${y.toFixed(1)})"/>`
      const stem = '<path d="M38 88 Q12 70 14 40 Q16 24 26 16 M62 88 Q88 70 86 40 Q84 24 74 16" fill="none" stroke="currentColor" stroke-width="2"/>'
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="currentColor">${stem}${leaves.map((l) => el(l, false) + el(l, true)).join('')}</g></svg>`
    })()
  },
  {
    key: 'star',
    label: 'Yıldız',
    ratio: 1,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="currentColor" d="M50 4l13.5 29.6 32.3 3.6-24 21.9 6.6 31.9L50 74.8 21.6 91l6.6-31.9-24-21.9 32.3-3.6z"/></svg>'
  },
  {
    key: 'heart',
    label: 'Kalp',
    ratio: 1,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="currentColor" d="M50 90S6 62 6 32a22 22 0 0 1 44-6 22 22 0 0 1 44 6c0 30-44 58-44 58z"/></svg>'
  },
  {
    key: 'crown',
    label: 'Taç',
    ratio: 1.4,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100"><path fill="currentColor" d="M10 30l30 26 30-46 30 46 30-26-12 58H22z"/><rect fill="currentColor" x="22" y="90" width="96" height="8" rx="2"/></svg>'
  },
  {
    key: 'bolt',
    label: 'Şimşek',
    ratio: 0.6,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100"><path fill="currentColor" d="M38 2L4 58h22l-6 40 36-58H34z"/></svg>'
  },
  {
    key: 'z47',
    label: 'Z 47',
    ratio: 1,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="currentColor" d="M18 10h64v14L42 66h40v14H18V66l40-42H18z"/><text x="50" y="97" font-family="Anton, Impact, sans-serif" font-size="16" text-anchor="middle" fill="currentColor">47</text></svg>'
  }
]

export const clipartUrl = (key, color) => {
  const art = CLIPART.find((c) => c.key === key)
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(art.svg.replaceAll('currentColor', color))
}

let seq = 0
export const newId = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`

export const newText = (ink) => ({ id: newId(), type: 'text', text: 'Yazını yaz', font: 'montserrat', color: ink, size: 0.14, x: 0.5, y: 0.3, rot: 0 })
export const newArt = (key, ink) => ({ id: newId(), type: 'art', art: key, color: ink, w: 0.42, x: 0.5, y: 0.45, rot: 0 })
export const newImage = (src, ratio, natural) => ({ id: newId(), type: 'image', src, ratio, natural, w: 0.6, x: 0.5, y: 0.45, rot: 0 })

export const fontOf = (key) => FONTS.find((f) => f.key === key) ?? FONTS[0]
export const layerText = (l) => (fontOf(l.font).upper ? l.text.toLocaleUpperCase('tr-TR') : l.text)

// Görsel katmanın baskıdaki çözünürlüğü (dpi)
export const imageDpi = (layer, area) => Math.round(layer.natural / ((layer.w * area.cm) / 2.54))

// Katmanın kaplayacağı yükseklik (alan genişliği cinsinden): görsellerde oran, yazıda satır sayısı
export const LINE = 1.12

// Görselleri bir kez yükleyip saklar (tuvale çizim için)
const images = new Map()
export function loadImage(src) {
  if (images.has(src)) return images.get(src)
  const p = new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
  images.set(src, p)
  return p
}

// Bir yüzün tasarımını tuvale çizer. W: alan genişliği (px); yükseklik alan oranına göre.
// bg verilirse önce kumaş rengi boyanır (sepet küçük resmi için)
export async function renderSide(canvas, layers, area, W, bg) {
  const H = Math.round((W * area.h) / area.w)
  const srcs = await Promise.all(layers.map((l) => (l.type === 'text' ? null : loadImage(l.type === 'art' ? clipartUrl(l.art, l.color) : l.src))))
  await document.fonts?.ready
  canvas.width = W
  canvas.height = H
  const c = canvas.getContext('2d')
  c.clearRect(0, 0, W, H)
  if (bg) {
    c.fillStyle = bg
    c.fillRect(0, 0, W, H)
  }
  layers.forEach((l, i) => {
    c.save()
    c.translate(l.x * W, l.y * H)
    c.rotate((l.rot * Math.PI) / 180)
    if (l.type === 'text') {
      const px = l.size * W
      c.font = fontOf(l.font).css.replace('1em', `${px}px`)
      c.fillStyle = l.color
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      const lines = layerText(l).split('\n')
      lines.forEach((t, k) => c.fillText(t, 0, (k - (lines.length - 1) / 2) * px * LINE))
    } else if (srcs[i]) {
      const w = l.w * W
      const h = w / (l.type === 'art' ? CLIPART.find((a) => a.key === l.art).ratio : l.ratio)
      c.drawImage(srcs[i], -w / 2, -h / 2, w, h)
    }
    c.restore()
  })
  return canvas
}

// Dosyadan yüklenen görseli en fazla EXPORT_PX genişliğe küçültür (tarayıcı belleği ve kayıt için)
export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = async () => {
      const img = await loadImage(reader.result)
      if (!img) return reject(new Error('Görsel açılamadı'))
      const natural = img.naturalWidth || 1000
      const ratio = (img.naturalWidth || 1) / (img.naturalHeight || 1)
      if (natural <= EXPORT_PX || file.type === 'image/svg+xml') return resolve({ src: reader.result, ratio, natural })
      const cv = document.createElement('canvas')
      cv.width = EXPORT_PX
      cv.height = Math.round(EXPORT_PX / ratio)
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
      resolve({ src: cv.toDataURL('image/png'), ratio, natural: EXPORT_PX })
    }
    reader.readAsDataURL(file)
  })
}

// Düz (2D) giysi çizimi için SVG yolu: 3D kalıpla aynı noktalar, y ekseni ters
export function garmentPath(product, side) {
  const half = product.pattern
  const neck = side === 'back' ? 0.93 : 0.72
  const hem = product.hem
  const [first, ...rest] = half
  const P = (x, y) => `${x.toFixed(3)} ${(-y).toFixed(3)}`
  let d = `M ${P(-first[0], first[1])}`
  rest.forEach(([x, y]) => (d += ` L ${P(-x, y)}`))
  const [hx] = half[half.length - 1]
  d += ` Q ${P(0, hem - 0.04)} ${P(hx, hem)}`
  ;[...rest].reverse().forEach(([x, y]) => (d += ` L ${P(x, y)}`))
  d += ` L ${P(first[0], first[1])} Q ${P(0, neck)} ${P(-first[0], first[1])} Z`
  return d
}
// Çizimin sınırları (viewBox): kalıbın en geniş noktaları
export const garmentBox = (product) => {
  const xs = product.pattern.map(([x]) => x)
  const maxX = Math.max(...xs) + 0.06
  return { x: -maxX, y: -1.06, w: maxX * 2, h: 1.06 - product.hem + 0.06 }
}
