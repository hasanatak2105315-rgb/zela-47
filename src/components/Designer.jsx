import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { PRODUCTS, formatPrice } from '../data/products'
import { useCart, unitPrice, CUSTOM_PRINT_FEE } from '../store/cart'
import { SizePicker } from './Overlays'
import {
  DESIGN_PRODUCTS,
  SIDES,
  FONTS,
  INKS,
  CLIPART,
  EXTRA_FONTS_URL,
  EXPORT_PX,
  MIN_DPI,
  LINE,
  clipartUrl,
  fontOf,
  layerText,
  imageDpi,
  newText,
  newArt,
  newImage,
  newId,
  readImageFile,
  renderSide,
  garmentPath,
  garmentBox
} from '../data/designer'

// Tasarım stüdyosu (/tasarla): Printful, Customink gibi sitelerdeki tişört tasarlayıcılara benzer.
// Ürün ve renk seçilir, ön ve arka yüze yazı, görsel ya da hazır grafik eklenir, sürükleyip
// büyütülür/döndürülür, tasarım canlı 3D önizlemede görünür ve sepete eklenir.

const DesignStage = lazy(() => import('../three/DesignStage'))

const DRAFT = 'zela-design'
const PREVIEW_PX = 768
const ITEMS = PRODUCTS.filter((p) => DESIGN_PRODUCTS[p.id])

const light = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150
}
const defaultInk = (fabric) => (light(fabric) ? '#1b1512' : '#ffffff')
const empty = () => ({ front: [], back: [] })

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT)) ?? null
  } catch {
    return null
  }
}
function saveDraft(draft) {
  try {
    localStorage.setItem(DRAFT, JSON.stringify(draft))
  } catch {
    // büyük görseller tarayıcı kotasını aşarsa görselsiz kaydedilir
    try {
      const strip = (ls) => ls.filter((l) => l.type !== 'image')
      localStorage.setItem(DRAFT, JSON.stringify({ ...draft, layers: { front: strip(draft.layers.front), back: strip(draft.layers.back) } }))
    } catch {}
  }
}

function initial() {
  const q = new URLSearchParams(window.location.search)
  const draft = loadDraft()
  const productId = DESIGN_PRODUCTS[q.get('urun')] ? q.get('urun') : DESIGN_PRODUCTS[draft?.productId] ? draft.productId : ITEMS[0].id
  const product = PRODUCTS.find((p) => p.id === productId)
  const wanted = q.get('renk') ?? (draft?.productId === productId ? draft.color : null)
  const color = product.colors.some(([, hex]) => hex === wanted) ? wanted : product.color
  const layers = draft?.layers && draft.productId === productId ? { front: draft.layers.front ?? [], back: draft.layers.back ?? [] } : empty()
  return { productId, color, layers }
}

/* ---------- Düzenleyici: düz giysi çizimi ve baskı alanındaki katmanlar ---------- */

function Layer({ layer, selected, onPointerDown, onHandle }) {
  const style = { left: `${layer.x * 100}%`, top: `${layer.y * 100}%`, transform: `translate(-50%, -50%) rotate(${layer.rot}deg)` }
  let body
  if (layer.type === 'text') {
    body = (
      <span
        className="dz-text"
        style={{ font: fontOf(layer.font).css.replace('1em', `${layer.size * 100}cqw`), color: layer.color, lineHeight: LINE }}
      >
        {layerText(layer) || ' '}
      </span>
    )
  } else {
    const src = layer.type === 'art' ? clipartUrl(layer.art, layer.color) : layer.src
    body = <img src={src} alt="" draggable={false} style={{ width: `${layer.w * 100}cqw` }} />
  }
  return (
    <div className={`dz-layer ${selected ? 'dz-layer--on' : ''}`} style={style} onPointerDown={onPointerDown}>
      {body}
      {selected && (
        <>
          <span className="dz-handle dz-handle--rot" onPointerDown={(e) => onHandle(e, 'rotate')} aria-hidden="true" />
          <span className="dz-handle dz-handle--size" onPointerDown={(e) => onHandle(e, 'scale')} aria-hidden="true" />
        </>
      )}
    </div>
  )
}

function Editor({ product, item, color, side, layers, selectedId, onSelect, onChange, onBegin }) {
  const area = product.sides[side]
  const box = garmentBox(product)
  const areaRef = useRef()
  const gesture = useRef(null)

  // Sürükleme, büyütme ve döndürme: koordinatlar baskı alanına göre 0-1 oranında
  const start = (e, layer, mode) => {
    e.stopPropagation()
    e.preventDefault()
    onSelect(layer.id)
    onBegin()
    const rect = areaRef.current.getBoundingClientRect()
    const cx = rect.left + layer.x * rect.width
    const cy = rect.top + layer.y * rect.height
    gesture.current = { mode, id: layer.id, rect, cx, cy, px: e.clientX, py: e.clientY, from: { ...layer }, dist: Math.hypot(e.clientX - cx, e.clientY - cy) || 1 }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.onpointermove = move
    e.currentTarget.onpointerup = e.currentTarget.onpointercancel = (ev) => {
      ev.currentTarget.onpointermove = null
      gesture.current = null
    }
  }
  const move = (e) => {
    const g = gesture.current
    if (!g) return
    const { from, rect } = g
    if (g.mode === 'move') {
      const clamp = (v) => Math.min(1.15, Math.max(-0.15, v))
      onChange(g.id, { x: clamp(from.x + (e.clientX - g.px) / rect.width), y: clamp(from.y + (e.clientY - g.py) / rect.height) })
    } else if (g.mode === 'scale') {
      const f = Math.hypot(e.clientX - g.cx, e.clientY - g.cy) / g.dist
      if (from.type === 'text') onChange(g.id, { size: Math.min(0.6, Math.max(0.03, from.size * f)) })
      else onChange(g.id, { w: Math.min(1.4, Math.max(0.05, from.w * f)) })
    } else {
      let deg = (Math.atan2(e.clientY - g.cy, e.clientX - g.cx) * 180) / Math.PI + 90
      deg = ((deg + 540) % 360) - 180
      const snap = Math.round(deg / 45) * 45
      if (Math.abs(deg - snap) < 4) deg = snap
      onChange(g.id, { rot: Math.round(deg) })
    }
  }

  const outside = layers.some((l) => l.x < 0 || l.x > 1 || l.y < 0 || l.y > 1)
  return (
    <div className="dz-stage">
      <div className="dz-canvas">
      <svg className="dz-garment" viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} aria-hidden="true">
        <path d={garmentPath(product, side)} fill={color} stroke="rgba(43,27,20,0.25)" strokeWidth="0.008" />
        {product.zip && side === 'front' && <line x1="0" y1={-0.86} x2="0" y2={-product.hem} stroke="#b9bec4" strokeWidth="0.02" />}
      </svg>
      <div
        ref={areaRef}
        className={`dz-area ${outside ? 'dz-area--warn' : ''}`}
        style={{
          left: `${((area.x - area.w / 2 - box.x) / box.w) * 100}%`,
          top: `${((-(area.y + area.h / 2) - box.y) / box.h) * 100}%`,
          width: `${(area.w / box.w) * 100}%`,
          aspectRatio: `${area.w} / ${area.h}`
        }}
        onPointerDown={() => onSelect(null)}
        role="application"
        aria-label={`${item.name} ${area.label} baskı alanı. Katmanı seçip ok tuşlarıyla kaydırabilir, Delete ile silebilirsin.`}
      >
        <span className="dz-area__label">
          {area.label} · {area.cm} cm
        </span>
        {layers.map((l) => (
          <Layer key={l.id} layer={l} selected={l.id === selectedId} onPointerDown={(e) => start(e, l, 'move')} onHandle={(e, mode) => start(e, l, mode)} />
        ))}
        {!layers.length && <span className="dz-area__empty">Yazı, görsel ya da grafik ekle</span>}
      </div>
      </div>
      {outside && <p className="dz-warn" role="status">Bir katman baskı alanının dışına taşıyor; taşan kısım basılmaz.</p>}
    </div>
  )
}

/* ---------- Ayar paneli parçaları ---------- */

function Inks({ value, onChange }) {
  return (
    <div className="dz-inks" role="radiogroup" aria-label="Renk">
      {INKS.map(([label, hex]) => (
        <button key={hex} type="button" role="radio" aria-checked={value === hex} aria-label={label} title={label} className={value === hex ? 'active' : ''} style={{ '--swatch': hex }} onClick={() => onChange(hex)} />
      ))}
      <label className="dz-inks__custom" title="Başka renk">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Başka renk seç" />
      </label>
    </div>
  )
}

function Range({ label, value, min, max, step, onChange, format }) {
  return (
    <label className="measure">
      <span>
        {label}
        <b>{format(value)}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

function LayerPanel({ layer, area, onChange, onAction, textRef }) {
  const dpi = layer.type === 'image' ? imageDpi(layer, area) : null
  return (
    <div className="dz-panel__group">
      <h3>{layer.type === 'text' ? 'Yazı' : layer.type === 'art' ? 'Grafik' : 'Görsel'}</h3>
      {layer.type === 'text' && (
        <>
          <label className="field">
            <span>Metin</span>
            <textarea ref={textRef} rows={2} maxLength={80} value={layer.text} onChange={(e) => onChange({ text: e.target.value }, 'text')} />
          </label>
          <div className="dz-fonts" role="radiogroup" aria-label="Yazı tipi">
            {FONTS.map((f) => (
              <button key={f.key} type="button" role="radio" aria-checked={layer.font === f.key} className={layer.font === f.key ? 'active' : ''} style={{ font: f.css.replace('1em', '1.05rem') }} onClick={() => onChange({ font: f.key })}>
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}
      {layer.type !== 'image' && <Inks value={layer.color} onChange={(color) => onChange({ color })} />}
      {layer.type === 'text' ? (
        <Range label="Boyut" value={layer.size} min={0.03} max={0.6} step={0.005} onChange={(size) => onChange({ size }, 'size')} format={(v) => `${Math.round((v * area.cm * 10) / 1) / 10} cm`} />
      ) : (
        <Range label="Genişlik" value={layer.w} min={0.05} max={1.4} step={0.01} onChange={(w) => onChange({ w }, 'w')} format={(v) => `${Math.round(v * area.cm * 10) / 10} cm`} />
      )}
      <Range label="Açı" value={layer.rot} min={-180} max={180} step={1} onChange={(rot) => onChange({ rot }, 'rot')} format={(v) => `${v}°`} />
      {dpi !== null && (
        <p className={dpi < MIN_DPI ? 'dz-warn' : 'dz-ok'} role="status">
          {dpi < MIN_DPI ? `Görsel bu boyutta bulanık basılabilir (${dpi} dpi). Küçült ya da daha büyük bir görsel yükle.` : `Baskı kalitesi iyi (${dpi} dpi).`}
        </p>
      )}
      <div className="dz-actions">
        <button type="button" onClick={() => onAction('center')}>Ortala</button>
        <button type="button" onClick={() => onAction('up')}>Öne al</button>
        <button type="button" onClick={() => onAction('down')}>Arkaya al</button>
        <button type="button" onClick={() => onAction('copy')}>Kopyala</button>
        <button type="button" className="dz-danger" onClick={() => onAction('delete')}>Sil</button>
      </div>
    </div>
  )
}

/* ---------- Sayfa ---------- */

export default function Designer() {
  const { add, setOpen } = useCart()
  const [init] = useState(initial)
  const [productId, setProductId] = useState(init.productId)
  const [color, setColor] = useState(init.color)
  const [layers, setLayers] = useState(init.layers)
  const [side, setSide] = useState(() => (init.layers.front.length || !init.layers.back.length ? 'front' : 'back'))
  const [selectedId, setSelectedId] = useState(null)
  const [size, setSize] = useState(null)
  const [qty, setQty] = useState(1)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const past = useRef([])
  const future = useRef([])
  const lastPush = useRef({ key: null, t: 0 })
  const fileRef = useRef()
  const textRef = useRef()
  const [, force] = useState(0)

  const item = PRODUCTS.find((p) => p.id === productId)
  const product = DESIGN_PRODUCTS[productId]
  const area = product.sides[side]
  const sideLayers = layers[side]
  const selected = sideLayers.find((l) => l.id === selectedId) ?? null
  const ink = defaultInk(color)
  const colorName = item.colors.find(([, hex]) => hex === color)?.[0]

  // ek yazı tipleri yalnızca bu sayfada yüklenir
  useEffect(() => {
    if (document.querySelector(`link[href="${EXTRA_FONTS_URL}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = EXTRA_FONTS_URL
    link.onload = () => document.fonts?.ready.then(() => setVersion((v) => v + 1))
    document.head.appendChild(link)
  }, [])

  // Geri al / yinele: her işlemden önce tasarımın kopyası saklanır.
  // Aynı ayar art arda değişirken (ör. boyut kaydırıcısı) tek adım sayılır
  const snapshot = useCallback(
    (key) => {
      const now = Date.now()
      if (key && lastPush.current.key === key && now - lastPush.current.t < 1200) return (lastPush.current.t = now)
      lastPush.current = { key, t: now }
      past.current.push(layers)
      if (past.current.length > 60) past.current.shift()
      future.current = []
      force((n) => n + 1)
    },
    [layers]
  )
  const undo = () => {
    if (!past.current.length) return
    future.current.push(layers)
    setLayers(past.current.pop())
    lastPush.current = { key: null, t: 0 }
  }
  const redo = () => {
    if (!future.current.length) return
    past.current.push(layers)
    setLayers(future.current.pop())
    lastPush.current = { key: null, t: 0 }
  }

  const setSideLayers = (fn) => setLayers((all) => ({ ...all, [side]: fn(all[side]) }))
  const patch = (id, values) => setSideLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...values } : l)))
  const addLayer = (layer) => {
    snapshot()
    setSideLayers((ls) => [...ls, layer])
    setSelectedId(layer.id)
    setErrors((x) => ({ ...x, design: undefined }))
  }

  const action = (kind) => {
    if (!selected) return
    snapshot()
    if (kind === 'delete') {
      setSideLayers((ls) => ls.filter((l) => l.id !== selected.id))
      setSelectedId(null)
    } else if (kind === 'copy') {
      const copy = { ...selected, id: newId(), x: Math.min(0.95, selected.x + 0.05), y: Math.min(0.95, selected.y + 0.05) }
      setSideLayers((ls) => [...ls, copy])
      setSelectedId(copy.id)
    } else if (kind === 'center') patch(selected.id, { x: 0.5 })
    else
      setSideLayers((ls) => {
        const i = ls.findIndex((l) => l.id === selected.id)
        const j = kind === 'up' ? i + 1 : i - 1
        if (j < 0 || j >= ls.length) return ls
        const next = [...ls]
        ;[next[i], next[j]] = [next[j], next[i]]
        return next
      })
  }

  // Klavye: Delete siler, oklar kaydırır, Ctrl+Z / Ctrl+Y geri al / yinele
  useEffect(() => {
    const onKey = (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)
      if ((e.ctrlKey || e.metaKey) && !typing && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        e.shiftKey ? redo() : undo()
      } else if ((e.ctrlKey || e.metaKey) && !typing && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      } else if (!typing && selected && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault()
        action('delete')
      } else if (!typing && selected && e.key.startsWith('Arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? 0.05 : 0.01
        snapshot('nudge' + selected.id)
        const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
        patch(selected.id, { x: selected.x + d[0], y: selected.y + d[1] })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Taslak tarayıcıda saklanır: sayfadan çıkıp dönünce tasarım kaybolmaz
  useEffect(() => {
    const t = setTimeout(() => saveDraft({ productId, color, layers }), 400)
    return () => clearTimeout(t)
  }, [productId, color, layers])

  // 3D önizleme için iki yüzün dokusu (tasarım değiştikçe yeniden çizilir)
  const canvases = useMemo(() => ({ front: document.createElement('canvas'), back: document.createElement('canvas') }), [])
  useEffect(() => {
    let live = true
    const id = requestAnimationFrame(async () => {
      await Promise.all(SIDES.map((s) => renderSide(canvases[s], layers[s], product.sides[s], PREVIEW_PX)))
      if (live) setVersion((v) => v + 1)
    })
    return () => {
      live = false
      cancelAnimationFrame(id)
    }
  }, [layers, product, canvases])

  const changeProduct = (id) => {
    if (id === productId) return
    const next = PRODUCTS.find((p) => p.id === id)
    snapshot()
    setProductId(id)
    setColor(next.colors.some(([, hex]) => hex === color) ? color : next.color)
    setSelectedId(null)
    setSize(null)
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError('')
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) return setUploadError('PNG, JPG, WEBP ya da SVG yükleyebilirsin.')
    if (file.size > 15 * 1024 * 1024) return setUploadError('Görsel en fazla 15 MB olabilir.')
    try {
      const { src, ratio, natural } = await readImageFile(file)
      addLayer(newImage(src, ratio, natural))
    } catch {
      setUploadError('Görsel açılamadı, başka bir dosya dene.')
    }
  }

  const used = SIDES.filter((s) => layers[s].length)
  const custom = used.length > 0
  const price = unitPrice(item, custom)
  const summary = (s) =>
    layers[s]
      .map((l) => (l.type === 'text' ? `“${l.text.replace(/\n/g, ' ')}”` : l.type === 'art' ? CLIPART.find((a) => a.key === l.art).label : 'görsel'))
      .join(' + ')

  const addToCart = async () => {
    const found = {}
    if (!size) found.size = true
    if (!custom) found.design = 'Önce tasarımına bir yazı, görsel ya da grafik ekle.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    const previews = {}
    for (const s of used) {
      const cv = await renderSide(document.createElement('canvas'), layers[s], product.sides[s], 240, color)
      previews[s] = cv.toDataURL('image/jpeg', 0.82)
    }
    add(item.id, qty, {
      size,
      color: colorName,
      custom: {
        id: newId(),
        place: used.map((s) => product.sides[s].label).join(' ve '),
        text: used.map((s) => `${product.sides[s].label}: ${summary(s)}`).join(' · '),
        previews
      }
    })
    setBusy(false)
    setOpen(true)
  }

  const download = async () => {
    for (const s of used) {
      const cv = await renderSide(document.createElement('canvas'), layers[s], product.sides[s], EXPORT_PX)
      const a = document.createElement('a')
      a.href = cv.toDataURL('image/png')
      a.download = `zela47-tasarim-${item.id}-${s === 'front' ? 'on' : 'arka'}.png`
      a.click()
    }
  }

  const reset = () => {
    snapshot()
    setLayers(empty())
    setSelectedId(null)
  }

  return (
    <section className="section designer">
      <div className="container">
        <div className="designer__head">
          <div>
            <p className="eyebrow">
              <span className="dot" /> Tasarım stüdyosu
            </p>
            <h1 className="display">
              Kendin <em>tasarla</em>
            </h1>
            <p className="muted">Yazını, görselini ya da hazır grafiklerimizi ekle, sürükleyip büyüt, 3D önizlemede kumaşın üstünde gör.</p>
          </div>
          <div className="dz-history">
            <button type="button" onClick={undo} disabled={!past.current.length} title="Geri al (Ctrl+Z)">
              ↶ Geri al
            </button>
            <button type="button" onClick={redo} disabled={!future.current.length} title="Yinele (Ctrl+Y)">
              ↷ Yinele
            </button>
          </div>
        </div>

        <div className="designer__grid">
          {/* Sol: ürün, renk ve eklenecekler */}
          <aside className="dz-panel" aria-label="Tasarım araçları">
            <div className="dz-panel__group">
              <h3>Ürün</h3>
              <div className="dz-choice" role="radiogroup" aria-label="Ürün">
                {ITEMS.map((p) => (
                  <button key={p.id} type="button" role="radio" aria-checked={p.id === productId} className={p.id === productId ? 'active' : ''} onClick={() => changeProduct(p.id)}>
                    {p.name}
                    <small>{formatPrice(p.price)}</small>
                  </button>
                ))}
              </div>
              <div className="colors" role="radiogroup" aria-label="Kumaş rengi">
                <span>
                  Kumaş <b>{colorName}</b>
                </span>
                <div>
                  {item.colors.map(([label, hex]) => (
                    <button key={hex} type="button" role="radio" aria-checked={color === hex} aria-label={label} title={label} className={color === hex ? 'active' : ''} style={{ '--swatch': hex }} onClick={() => setColor(hex)} />
                  ))}
                </div>
              </div>
            </div>

            <div className="dz-panel__group">
              <h3>Ekle</h3>
              <div className="dz-add">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    addLayer(newText(ink))
                    setTimeout(() => textRef.current?.select(), 50)
                  }}
                >
                  Aa · Yazı
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => fileRef.current.click()}>
                  ⇪ Görsel yükle
                </button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={onFile} />
              </div>
              {uploadError && (
                <p className="dz-warn" role="alert">
                  {uploadError}
                </p>
              )}
              <div className="dz-clipart" aria-label="Hazır grafikler">
                {CLIPART.map((c) => (
                  <button key={c.key} type="button" title={c.label} aria-label={`${c.label} ekle`} onClick={() => addLayer(newArt(c.key, ink))}>
                    <img src={clipartUrl(c.key, '#2b1b14')} alt="" />
                  </button>
                ))}
              </div>
            </div>

            {selected ? (
              <LayerPanel
                key={selected.id}
                layer={selected}
                area={area}
                textRef={textRef}
                onChange={(values, key) => {
                  snapshot(key ? key + selected.id : undefined)
                  patch(selected.id, values)
                }}
                onAction={action}
              />
            ) : (
              sideLayers.length > 0 && <p className="muted dz-hint">Düzenlemek için tasarımdaki bir öğeye dokun.</p>
            )}

            {sideLayers.length > 0 && (
              <div className="dz-panel__group">
                <h3>Katmanlar · {area.label}</h3>
                <ol className="dz-layers">
                  {[...sideLayers].reverse().map((l) => (
                    <li key={l.id}>
                      <button type="button" className={l.id === selectedId ? 'active' : ''} onClick={() => setSelectedId(l.id)}>
                        {l.type === 'text' ? `Yazı: ${l.text.slice(0, 18) || '—'}` : l.type === 'art' ? CLIPART.find((a) => a.key === l.art).label : 'Görsel'}
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </aside>

          {/* Orta: düzenleme alanı */}
          <div className="dz-center">
            <div className="dz-sides" role="tablist" aria-label="Baskı yüzü">
              {SIDES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={side === s}
                  className={side === s ? 'active' : ''}
                  onClick={() => {
                    setSide(s)
                    setSelectedId(null)
                  }}
                >
                  {s === side && <motion.span layoutId="dz-side-pill" className="filter-pill" />}
                  <span>
                    {product.sides[s].label}
                    {layers[s].length > 0 && <i className="dz-count">{layers[s].length}</i>}
                  </span>
                </button>
              ))}
            </div>
            <Editor
              product={product}
              item={item}
              color={color}
              side={side}
              layers={sideLayers}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={patch}
              onBegin={() => snapshot()}
            />
            <p className="dz-tip muted">Sürükle: taşı · köşedeki nokta: büyüt · üstteki nokta: döndür · oklar: ince ayar · Delete: sil</p>
          </div>

          {/* Sağ: 3D önizleme ve sipariş */}
          <aside className="dz-order" aria-label="Önizleme ve sipariş">
            <div className="dz-preview" role="img" aria-label={`${item.name} 3D önizleme, ${product.sides[side].label} yüzü`}>
              <Suspense fallback={<div className="stage-loader" aria-hidden="true" />}>
                <DesignStage productId={productId} product={product} color={color} canvases={canvases} version={version} side={side} />
              </Suspense>
              <span className="dz-preview__label">3D önizleme · sürükleyip çevir</span>
            </div>
            <SizePicker
              product={item}
              value={size}
              error={errors.size}
              onChange={(s) => {
                setSize(s)
                setErrors((x) => ({ ...x, size: undefined }))
              }}
            />
            <div className="dz-buy">
              <div className="qty">
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Azalt">
                  −
                </button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)} aria-label="Artır">
                  +
                </button>
              </div>
              <div className="dz-price">
                <small>Toplam</small>
                <strong>{formatPrice(price * qty)}</strong>
              </div>
            </div>
            {errors.design && (
              <p className="dz-warn" role="alert">
                {errors.design}
              </p>
            )}
            <button type="button" className="btn btn--primary btn--block" onClick={addToCart} disabled={busy}>
              {busy ? 'Hazırlanıyor…' : 'Sepete Ekle'}
            </button>
            <div className="dz-secondary">
              <button type="button" onClick={download} disabled={!custom}>
                Baskı dosyasını indir (PNG)
              </button>
              <button type="button" onClick={reset} disabled={!custom}>
                Tasarımı temizle
              </button>
            </div>
            <p className="note">
              Baskı {used.length ? used.map((s) => product.sides[s].label.toLocaleLowerCase('tr-TR')).join(' ve ') : 'seçtiğin yüz'} için yapılır
              {CUSTOM_PRINT_FEE > 0 ? `, kişiye özel baskı için ${formatPrice(CUSTOM_PRINT_FEE)} eklenir` : ', ek ücret yok'}. Üretimden önce sana son hâlinin önizlemesini gönderip onayını alıyoruz.
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
