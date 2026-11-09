// Tasarım stüdyosu: ürünler, baskı alanları, yazı tipleri, mürekkep renkleri, şekil kütüphanesi
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

// Şekil kütüphanesi: renklendirilebilir SVG (currentColor yerine seçilen mürekkep rengi yazılır).
// Kategoriler panelde sekme olarak görünür. Marka logosu bilerek yok: alıcı kendi tercihini yapsın
export const SHAPE_CATS = [
  ['basic', 'Temel'],
  ['icon', 'Simge'],
  ['nature', 'Doğa'],
  ['sport', 'Spor'],
  ['decor', 'Süs']
]

const S = (key, label, cat, body, vb = '0 0 100 100') => {
  const [, , w, h] = vb.split(' ').map(Number)
  return { key, label, cat, ratio: w / h, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><g fill="currentColor">${body}</g></svg>` }
}
const line = (d, w = 7) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
const rad = (deg) => (deg * Math.PI) / 180
const pt = (r, deg, cx = 50, cy = 50) => `${(cx + Math.cos(rad(deg)) * r).toFixed(1)} ${(cy + Math.sin(rad(deg)) * r).toFixed(1)}`
// Dişli yıldız: n uç, dış ve iç yarıçap
const burst = (n, outer, inner, start = -90, cx = 50, cy = 50) =>
  'M' + Array.from({ length: n * 2 }, (_, i) => pt(i % 2 ? inner : outer, start + (i * 180) / n, cx, cy)).join('L') + 'Z'

const laurel = (() => {
  const leaves = []
  for (let i = 0; i < 9; i++) {
    const deg = 250 - i * 15.5
    const a = rad(deg)
    for (const [r, tilt] of [[33, -32], [43, 32]]) leaves.push([50 + Math.cos(a) * r, 52 - Math.sin(a) * r, 180 - deg + tilt, 1 - i * 0.035])
  }
  const el = ([x, y, rot, k], m) =>
    `<ellipse cx="${(m ? 100 - x : x).toFixed(1)}" cy="${y.toFixed(1)}" rx="${(3.6 * k).toFixed(1)}" ry="${(8.4 * k).toFixed(1)}" transform="rotate(${(m ? -rot : rot).toFixed(0)} ${(m ? 100 - x : x).toFixed(1)} ${y.toFixed(1)})"/>`
  return line('M38 88 Q12 70 14 40 Q16 24 26 16 M62 88 Q88 70 86 40 Q84 24 74 16', 2) + leaves.map((l) => el(l, false) + el(l, true)).join('')
})()

const sun =
  '<circle cx="50" cy="50" r="21"/>' +
  Array.from({ length: 12 }, (_, i) => `<path d="M${pt(28, i * 30 - 7)}L${pt(47, i * 30)}L${pt(28, i * 30 + 7)}Z"/>`).join('')
const flower =
  '<mask id="m"><rect width="100" height="100" fill="#fff"/><circle cx="50" cy="50" r="9" fill="#000"/></mask><g mask="url(#m)">' +
  Array.from({ length: 6 }, (_, i) => `<ellipse cx="50" cy="27" rx="13" ry="22" transform="rotate(${i * 60} 50 50)"/>`).join('') +
  '<circle cx="50" cy="50" r="15"/></g>'
const football =
  line('M50 50m-43 0a43 43 0 1 0 86 0a43 43 0 1 0-86 0', 6) +
  `<path d="M${Array.from({ length: 5 }, (_, i) => pt(17, -90 + i * 72)).join('L')}Z"/>` +
  line(Array.from({ length: 5 }, (_, i) => `M${pt(17, -90 + i * 72)}L${pt(43, -90 + i * 72)}`).join(''), 5)

export const CLIPART = [
  // Temel
  S('circle', 'Daire', 'basic', '<circle cx="50" cy="50" r="46"/>'),
  S('square', 'Kare', 'basic', '<rect x="6" y="6" width="88" height="88" rx="6"/>'),
  S('triangle', 'Üçgen', 'basic', '<path d="M50 6L96 90H4z"/>'),
  S('diamond', 'Baklava', 'basic', '<path d="M50 3L97 50 50 97 3 50z"/>'),
  S('hexagon', 'Altıgen', 'basic', '<path d="M27 8h46l23 42-23 42H27L4 50z"/>'),
  S('ring', 'Halka', 'basic', '<path fill-rule="evenodd" d="M50 4a46 46 0 1 0 0 92a46 46 0 1 0 0-92zm0 15a31 31 0 1 1 0 62a31 31 0 1 1 0-62z"/>'),
  S('star', 'Yıldız', 'basic', '<path d="M50 4l13.5 29.6 32.3 3.6-24 21.9 6.6 31.9L50 74.8 21.6 91l6.6-31.9-24-21.9 32.3-3.6z"/>'),
  S('heart', 'Kalp', 'basic', '<path d="M50 90S6 62 6 32a22 22 0 0 1 44-6 22 22 0 0 1 44 6c0 30-44 58-44 58z"/>'),
  S('arrow', 'Ok', 'basic', '<path d="M4 38h52V14l40 36-40 36V62H4z"/>'),
  S('frame', 'Çerçeve', 'basic', '<path fill-rule="evenodd" d="M4 4h92v92H4zM14 14v72h72V14z"/>'),
  S('dots', 'Noktalar', 'basic', Array.from({ length: 9 }, (_, i) => `<circle cx="${20 + (i % 3) * 30}" cy="${20 + Math.floor(i / 3) * 30}" r="10"/>`).join('')),
  S('stripes', 'Çizgiler', 'basic', [12, 36, 60, 84].map((y) => `<rect x="4" y="${y - 7}" width="92" height="14" rx="3"/>`).join('')),
  // Simgeler
  S('crown', 'Taç', 'icon', '<path d="M10 30l30 26 30-46 30 46 30-26-12 58H22z"/><rect x="22" y="90" width="96" height="8" rx="2"/>', '0 0 140 100'),
  S('bolt', 'Şimşek', 'icon', '<path d="M38 2L4 58h22l-6 40 36-58H34z"/>', '0 0 60 100'),
  S('flame', 'Alev', 'icon', '<path d="M50 4c6 20 32 32 32 58a32 32 0 0 1-64 0c0-15 8-24 15-30 0 11 4 18 11 20-4-19 2-35 6-48z"/>'),
  S('music', 'Nota', 'icon', '<path d="M38 18L88 6v14L38 32z"/><rect x="38" y="18" width="7" height="58"/><rect x="81" y="6" width="7" height="58"/><ellipse cx="30" cy="77" rx="14" ry="10.5" transform="rotate(-22 30 77)"/><ellipse cx="73" cy="65" rx="14" ry="10.5" transform="rotate(-22 73 65)"/>'),
  S('smile', 'Gülen yüz', 'icon', '<mask id="m"><rect width="100" height="100" fill="#fff"/><circle cx="35" cy="40" r="6.5" fill="#000"/><circle cx="65" cy="40" r="6.5" fill="#000"/><path d="M28 58q22 24 44 0q-22 10-44 0z" fill="#000"/></mask><circle cx="50" cy="50" r="46" mask="url(#m)"/>'),
  S('bubble', 'Konuşma balonu', 'icon', '<path d="M14 8h72a10 10 0 0 1 10 10v46a10 10 0 0 1-10 10H46L24 94V74H14A10 10 0 0 1 4 64V18A10 10 0 0 1 14 8z"/>'),
  S('anchor', 'Çapa', 'icon', '<circle cx="50" cy="16" r="9" fill="none" stroke="currentColor" stroke-width="7"/>' + line('M50 25v66M30 42h40M14 62q4 28 36 29q32-1 36-29', 7)),
  S('infinity', 'Sonsuzluk', 'icon', line('M50 25C40 11 16 7 16 25s24 14 34 0 34-18 34 0-24 14-34 0z', 8), '0 0 100 50'),
  S('peace', 'Barış', 'icon', line('M50 50m-42 0a42 42 0 1 0 84 0a42 42 0 1 0-84 0M50 8v84M50 50L20 80M50 50l30 30', 8)),
  S('eye', 'Göz', 'icon', '<mask id="m"><rect width="100" height="60" fill="#fff"/><circle cx="50" cy="30" r="14" fill="#000"/></mask><path mask="url(#m)" d="M2 30Q50-22 98 30Q50 82 2 30z"/><circle cx="50" cy="30" r="7"/>', '0 0 100 60'),
  // Doğa
  S('sun', 'Güneş', 'nature', sun),
  S('moon', 'Ay', 'nature', '<path d="M60 4a46 46 0 1 0 36 70A36 36 0 0 1 60 4z"/>'),
  S('cloud', 'Bulut', 'nature', '<path d="M26 80a20 20 0 0 1-3-40 26 26 0 0 1 50-6 23 23 0 0 1 4 46z"/>', '0 16 100 68'),
  S('leaf', 'Yaprak', 'nature', '<path d="M88 8C40 8 8 34 14 80l-8 12 6 4 8-12C64 88 92 54 88 8z"/>'),
  S('flower', 'Çiçek', 'nature', flower),
  S('mountain', 'Dağ', 'nature', '<path d="M2 90L36 30l16 26 12-20 34 54z"/>', '0 24 100 70'),
  S('wave', 'Dalga', 'nature', line('M6 38q11-14 22 0t22 0 22 0 22 0M6 62q11-14 22 0t22 0 22 0 22 0', 8), '0 22 100 56'),
  S('tree', 'Çam', 'nature', '<path d="M50 4L22 40h14L16 66h22v28h24V66h22L64 40h14z"/>'),
  S('paw', 'Pati', 'nature', '<ellipse cx="50" cy="68" rx="23" ry="20"/><ellipse cx="20" cy="42" rx="9" ry="12" transform="rotate(-22 20 42)"/><ellipse cx="39" cy="24" rx="9" ry="12.5"/><ellipse cx="61" cy="24" rx="9" ry="12.5"/><ellipse cx="80" cy="42" rx="9" ry="12" transform="rotate(22 80 42)"/>'),
  // Spor
  S('football', 'Futbol topu', 'sport', football),
  S('basketball', 'Basketbol topu', 'sport', line('M50 50m-43 0a43 43 0 1 0 86 0a43 43 0 1 0-86 0M7 50h86M50 7v86M21 19q22 31 0 62M79 19q-22 31 0 62', 6)),
  S('trophy', 'Kupa', 'sport', '<path d="M26 8h48v28a24 24 0 0 1-48 0z"/>' + line('M26 16H12v6a16 16 0 0 0 16 16M74 16h14v6a16 16 0 0 1-16 16', 6) + '<rect x="44" y="58" width="12" height="18"/><rect x="30" y="76" width="40" height="9" rx="2"/><rect x="24" y="87" width="52" height="8" rx="2"/>'),
  S('medal', 'Madalya', 'sport', '<path d="M28 4h16l10 30H40zM56 4h16L62 34H46z"/><mask id="m"><rect width="100" height="100" fill="#fff"/><path d="' + burst(5, 15, 6.5, -90, 50, 65) + '" fill="#000"/></mask><circle cx="50" cy="64" r="30" mask="url(#m)"/>'),
  S('dumbbell', 'Dambıl', 'sport', '<rect x="4" y="38" width="10" height="24" rx="3"/><rect x="14" y="26" width="12" height="48" rx="3"/><rect x="26" y="44" width="48" height="12"/><rect x="74" y="26" width="12" height="48" rx="3"/><rect x="86" y="38" width="10" height="24" rx="3"/>', '0 20 100 60'),
  S('flag', 'Bayrak', 'sport', '<rect x="16" y="4" width="8" height="92" rx="3"/><path d="M24 8h60L72 28l12 20H24z"/>'),
  S('number1', 'Bir numara', 'sport', '<mask id="m"><rect width="100" height="100" fill="#fff"/><path d="M44 26h14v50H46V40l-8 4v-11z" fill="#000"/></mask><circle cx="50" cy="50" r="46" mask="url(#m)"/>'),
  // Süsler
  S('laurel', 'Defne çelengi', 'decor', laurel),
  S('sparkle', 'Parıltı', 'decor', '<path d="M50 2C54 34 66 46 98 50 66 54 54 66 50 98 46 66 34 54 2 50 34 46 46 34 50 2z"/>'),
  S('sparkles', 'Parıltılar', 'decor', '<path d="M40 6C43 30 52 39 76 42 52 45 43 54 40 78 37 54 28 45 4 42 28 39 37 30 40 6z"/><path d="M78 56C80 70 84 74 96 76 84 78 80 82 78 96 76 82 72 78 60 76 72 74 76 70 78 56z"/>'),
  S('burst', 'Rozet', 'decor', `<path d="${burst(16, 47, 39)}"/>`),
  S('ribbon', 'Kurdele', 'decor', '<path d="M2 42h22v30H2l9-15zM98 42H76v30h22l-9-15z"/><rect x="14" y="28" width="72" height="36" rx="2"/>', '0 24 100 52'),
  S('divider', 'Ayraç', 'decor', line('M4 50h30M66 50h30', 5) + '<path d="M50 36l14 14-14 14-14-14z"/><circle cx="4" cy="50" r="4"/><circle cx="96" cy="50" r="4"/>', '0 30 100 40'),
  S('swirl', 'Kıvrım', 'decor', line('M8 60c0-24 30-30 38-12s-10 26-18 16 6-22 22-18 28 22 42 4', 6), '0 26 100 50'),
  S('shield', 'Kalkan', 'decor', '<path d="M50 4l40 14v28c0 26-18 42-40 50C28 88 10 72 10 46V18z"/>')
]

export const clipartUrl = (key, color) => {
  const art = CLIPART.find((c) => c.key === key)
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(art.svg.replaceAll('currentColor', color))
}

let seq = 0
export const newId = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`

export const newText = (ink) => ({ id: newId(), type: 'text', text: 'Yazını yaz', font: 'montserrat', color: ink, size: 0.14, x: 0.5, y: 0.3, rot: 0 })
export const newArt = (key, ink) => ({ id: newId(), type: 'art', art: key, color: ink, w: 0.42, x: 0.5, y: 0.45, rot: 0 })
// Fotoğraf: alanın yüksekliğini aşmayacak genişlikte, verilen noktaya (sürükle-bırak) ya da ortaya yerleşir
export const newImage = (src, ratio, natural, area, at) => ({
  id: newId(),
  type: 'image',
  src,
  ratio,
  natural,
  shape: 'none',
  filter: 'none',
  w: Math.round(Math.min(0.6, (0.8 * ratio * area.h) / area.w) * 1000) / 1000,
  x: at?.x ?? 0.5,
  y: at?.y ?? 0.45,
  rot: 0
})

// Fotoğraf şekilleri: yuvarlak ve kalp kare kırpılır (fotoğrafın ortası alınır)
export const SHAPES = [
  { key: 'none', label: 'Orijinal' },
  { key: 'rounded', label: 'Oval köşe' },
  { key: 'circle', label: 'Yuvarlak' },
  { key: 'heart', label: 'Kalp' }
]
// Fotoğraf filtreleri: aynı CSS filtresi düzenleyicide ve baskı dosyasında kullanılır
export const FILTERS = [
  { key: 'none', label: 'Orijinal', css: 'none' },
  { key: 'bw', label: 'Siyah-beyaz', css: 'grayscale(1) contrast(1.1)' },
  { key: 'sepia', label: 'Sepya', css: 'sepia(0.85) contrast(1.05)' },
  { key: 'vivid', label: 'Canlı', css: 'saturate(1.6) contrast(1.08)' },
  { key: 'fade', label: 'Soluk', css: 'saturate(0.55) brightness(1.08) contrast(0.9)' }
]
export const filterCss = (key) => FILTERS.find((f) => f.key === key)?.css ?? 'none'
const HEART = 'M50 92S4 62 4 31a23 23 0 0 1 46-6 23 23 0 0 1 46 6c0 31-46 61-46 61z'
export const HEART_MASK = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${HEART}"/></svg>`)}")`
const squareShape = (l) => l.type === 'image' && (l.shape === 'circle' || l.shape === 'heart')
// Oval köşe yarıçapı (katman genişliğine oranla)
export const ROUND = 0.08

// Katmanın en/boy oranı (yazı hariç)
export const layerRatio = (l) => (l.type === 'art' ? CLIPART.find((a) => a.key === l.art).ratio : squareShape(l) ? 1 : l.ratio)

export const fontOf = (key) => FONTS.find((f) => f.key === key) ?? FONTS[0]
export const layerText = (l) => (fontOf(l.font).upper ? l.text.toLocaleUpperCase('tr-TR') : l.text)

// Fotoğrafın baskıdaki çözünürlüğü (dpi); kare kırpılınca yatay fotoğrafın eni kısalır
export const imageDpi = (layer, area) => {
  const px = squareShape(layer) && layer.ratio > 1 ? layer.natural / layer.ratio : layer.natural
  return Math.round(px / ((layer.w * area.cm) / 2.54))
}

// Fotoğrafı kutuya "kaplayarak" çizer (taşan kısım kırpılır), şekil maskesi ve filtreyle
function drawPhoto(c, img, l, w, h) {
  c.filter = filterCss(l.filter)
  if (l.shape === 'circle' || l.shape === 'heart' || l.shape === 'rounded') {
    c.beginPath()
    if (l.shape === 'circle') c.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2)
    else if (l.shape === 'rounded') c.roundRect(-w / 2, -h / 2, w, h, ROUND * w)
    else {
      const p = new Path2D()
      p.addPath(new Path2D(HEART), new DOMMatrix().translate(-w / 2, -h / 2).scale(w / 100, h / 100))
      c.clip(p)
    }
    if (l.shape !== 'heart') c.clip()
  }
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (!iw || !ih) return c.drawImage(img, -w / 2, -h / 2, w, h)
  const s = Math.max(w / iw, h / ih)
  const sw = w / s
  const sh = h / s
  c.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, -w / 2, -h / 2, w, h)
}

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
      const h = w / layerRatio(l)
      if (l.type === 'image') drawPhoto(c, srcs[i], l, w, h)
      else c.drawImage(srcs[i], -w / 2, -h / 2, w, h)
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
