import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CATEGORIES, PRODUCTS, formatPrice, withColor, discount } from '../data/products'
import { useCart } from '../store/cart'
import { setTryOn, useTryOn } from '../store/tryon'
import { FIELDS, GENDERS, useBody, setBody, setGender, resetBody, setBodyOpen, topSize, bottomSize, recommendedSize } from '../store/body'
import { PenIcon, FavoriteButton } from './Overlays'
import { useFavorites, useFavoritesRequest, takeFavoritesRequest } from '../store/favorites'

const CardView = lazy(() => import('../three/ProductViews').then((m) => ({ default: m.CardView })))
const MannequinView = lazy(() => import('../three/ProductViews').then((m) => ({ default: m.MannequinView })))

const FAV = 'Favorilerim'

// Manken yalnızca giyilebilen (bedeni olan) ürünleri gösterir
const wearable = (p) => !!p.sizes

// Manken yalnızca fareli, geniş ekranlarda gösterilir (dokunmatikte "üzerine gelme" yok)
const WIDE = '(min-width: 1025px) and (hover: hover)'
function useWide() {
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches)
  useEffect(() => {
    const mq = window.matchMedia(WIDE)
    const onChange = () => setWide(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return wide
}

const RulerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 17 17 3l4 4L7 21l-4-4ZM7 13l2 2M10 10l2 2M13 7l2 2" />
  </svg>
)

// Ziyaretçinin ölçüleri: kaydırdıkça manken canlı olarak şekillenir, beden önerilir
function BodyForm({ body }) {
  return (
    <motion.div
      className="tryon__form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
    >
      {FIELDS.map((f) => (
        <label key={f.key} className="measure">
          <span>
            {f.label}
            <b>
              {Math.round(body[f.key])} {f.unit}
            </b>
          </span>
          <input
            type="range"
            min={f.min}
            max={f.max}
            step={1}
            value={body[f.key]}
            onChange={(e) => setBody({ [f.key]: Number(e.target.value) })}
            aria-label={`${f.label} (${f.unit})`}
          />
        </label>
      ))}
      <p className="tryon__size">
        Önerilen beden: üst <b>{topSize(body)}</b> · alt <b>{bottomSize(body)}</b>
      </p>
      <div className="tryon__actions">
        <button className="btn btn--ghost" onClick={resetBody}>
          Sıfırla
        </button>
        <button className="btn btn--primary" onClick={() => setBodyOpen(false)}>
          Tamam
        </button>
      </div>
    </motion.div>
  )
}

// Ürünlerin yanında ekranla birlikte kayan sanal prova alanı
function TryOn({ hidden }) {
  const product = useTryOn()
  const body = useBody()
  const size = recommendedSize(product, body)
  return (
    <aside className={`tryon ${body.open ? 'tryon--edit' : ''}`} aria-label="Sanal prova" hidden={hidden}>
      <div className="tryon__stage" role="img" aria-label={product ? `Mankenin üzerinde ${product.name}` : 'Vitrin mankeni'}>
        <Suspense fallback={<div className="stage-loader" aria-hidden="true" />}>
          <MannequinView className="tryon__view" visible={!hidden} />
        </Suspense>
      </div>
      <p className="eyebrow tryon__label">
        <span className="dot" /> Sanal prova
      </p>
      <div className="tryon__gender" role="group" aria-label="Manken">
        {GENDERS.map((g) => (
          <button key={g.key} className={body.gender === g.key ? 'active' : ''} aria-pressed={body.gender === g.key} onClick={() => setGender(g.key)}>
            {body.gender === g.key && <motion.span layoutId="gender-pill" className="filter-pill" />}
            <span>{g.label}</span>
          </button>
        ))}
      </div>
      <button className="tryon__measure" onClick={() => setBodyOpen(!body.open)} aria-expanded={body.open}>
        <RulerIcon /> {body.custom ? 'Ölçülerim' : 'Ölçülerini gir'}
      </button>
      <AnimatePresence>{body.open && <BodyForm body={body} />}</AnimatePresence>
      {!body.open && (
        <div className="tryon__info">
          <AnimatePresence mode="wait">
            <motion.div
              key={product?.id ?? 'empty'}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              {product ? (
                <>
                  <small>{product.category}</small>
                  <strong>{product.name}</strong>
                  <span className="price">{formatPrice(product.price)}</span>
                  {size && <span className="tryon__fit">Ölçülerine göre önerilen beden: {size}</span>}
                </>
              ) : (
                <span className="tryon__hint">Bir ürünün üzerine gel, mankende gör. Ölçülerini girersen manken sana benzesin.</span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
      <a className="tryon__credit" href="https://sketchfab.com/DNC44" target="_blank" rel="noopener noreferrer">
        3D manken: DNC44 · CC BY 4.0
      </a>
    </aside>
  )
}

function ProductCard({ product: base, index, shown, onOpen, onCustom }) {
  const { add } = useCart()
  const hovered = useRef(false)
  const ref = useRef()
  // kartta seçilen renk: 3D model, manken ve ürün detayı bu rengi kullanır
  const [color, setColor] = useState(base.color)
  const product = withColor(base, color)
  const off = discount(base)

  // Fareye göre hafif 3D eğim
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    ref.current.style.setProperty('--rx', `${-y * 6}deg`)
    ref.current.style.setProperty('--ry', `${x * 8}deg`)
    ref.current.style.setProperty('--mx', `${(x + 0.5) * 100}%`)
    ref.current.style.setProperty('--my', `${(y + 0.5) * 100}%`)
  }
  const onLeave = () => {
    hovered.current = false
    ref.current.style.setProperty('--rx', '0deg')
    ref.current.style.setProperty('--ry', '0deg')
  }

  return (
    <motion.article
      ref={ref}
      className="card"
      hidden={!shown}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => {
        hovered.current = true
        if (wearable(product)) setTryOn(product)
      }}
      onFocus={() => wearable(product) && setTryOn(product)}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <button className="card__stage" onClick={() => onOpen(product)} aria-label={`${product.name} detay`}>
        <span className="card__index">{String(index + 1).padStart(2, '0')}</span>
        {product.tag && <span className="card__tag">{product.tag}</span>}
        <Suspense fallback={<div className="stage-loader" aria-hidden="true" />}>
          <CardView className="card__view" product={product} hovered={hovered} visible={shown} />
        </Suspense>
        <span className="card__look">İncele</span>
      </button>
      <div className="card__body">
        <div>
          <small>{product.category}</small>
          <h3>{product.name}</h3>
          <div className="price">
            {formatPrice(product.price)}
            {product.oldPrice && <s>{formatPrice(product.oldPrice)}</s>}
            {off > 0 && <em className="price__off">%{off}</em>}
          </div>
          {base.colors && (
            <div className="swatches" role="radiogroup" aria-label={`${base.name} rengi`}>
              {base.colors.map(([label, hex]) => (
                <button
                  key={hex}
                  type="button"
                  role="radio"
                  aria-checked={color === hex}
                  aria-label={label}
                  title={label}
                  className={color === hex ? 'active' : ''}
                  style={{ '--swatch': hex }}
                  onClick={() => {
                    setColor(hex)
                    setTryOn(withColor(base, hex))
                  }}
                />
              ))}
            </div>
          )}
          <button className="custom-btn" onClick={() => onCustom(product)}>
            <PenIcon /> Kişiye özel baskı
          </button>
        </div>
        <div className="card__actions">
          <FavoriteButton id={product.id} />
          {/* Giyimde önce beden seçilsin diye ürün detayı açılır */}
          <button
            className="add-btn"
            onClick={() => (product.sizes ? onOpen(product) : add(product.id))}
            aria-label={product.sizes ? 'Beden seç ve sepete ekle' : 'Sepete ekle'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </motion.article>
  )
}

export default function Collection({ onOpen, onCustom }) {
  const [cat, setCat] = useState('Tümü')
  // ilk kategori değişiminden sonra yeniden görünen kartlar CSS ile hafifçe belirir
  const [switched, setSwitched] = useState(false)
  const favs = useFavorites()
  const favRequest = useFavoritesRequest()
  // menüdeki kalp butonu: "Favorilerim" filtresi açılır
  useEffect(() => {
    if (favRequest && takeFavoritesRequest()) {
      setCat(FAV)
      setSwitched(true)
    }
  }, [favRequest])
  const cats = favs.length || cat === FAV ? [...CATEGORIES, FAV] : CATEGORIES
  const list = cat === 'Tümü' ? PRODUCTS : cat === FAV ? PRODUCTS.filter((p) => favs.includes(p.id)) : PRODUCTS.filter((p) => p.category === cat)
  // listede giyilebilen ürün yoksa manken alanı gizlenir, ürünler tam genişlikte dizilir.
  // Manken kaldırılmaz, yalnızca gizlenir: yeniden kurmak kategori değişiminde ekranı takıyordu
  const wide = useWide()
  const tryOn = wide && list.some(wearable)

  return (
    <section className="section" id="koleksiyon">
      <div className="container">
        <div className="section__head">
          <div>
            <p className="eyebrow">
              <span className="dot" /> Koleksiyon
            </p>
            <h2 className="display">
              Sana özel <em>tasarımlar</em>
            </h2>
          </div>
          <div className="filters">
            {cats.map((c) => (
              <button
                key={c}
                className={c === cat ? 'active' : ''}
                onClick={() => {
                  setCat(c)
                  setSwitched(true)
                }}
              >
                {c === cat && <motion.span layoutId="filter-pill" className="filter-pill" />}
                <span>{c}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={tryOn ? 'collection collection--tryon' : 'collection'}>
          {wide && <TryOn hidden={!tryOn} />}
          {/* Tüm kartlar bir kez kurulur, kategori değişince yalnızca gizlenir/gösterilir.
              Her geçişte kartları ve 3D modellerini baştan kurmak ekranı ~0,15 sn donduruyordu */}
          <div className={switched ? 'grid grid--switched' : 'grid'}>
            {PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} index={list.indexOf(p)} shown={list.includes(p)} onOpen={onOpen} onCustom={onCustom} />
            ))}
            {cat === FAV && !list.length && <p className="grid__empty muted">Henüz favorin yok. Beğendiğin ürünün kalbine dokun, burada görünsün.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
