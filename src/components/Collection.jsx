import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { CATEGORIES, PRODUCTS, formatPrice, withColor, discount, soldOut } from '../data/products'
import { useCart, FREE_SHIPPING } from '../store/cart'
import { PenIcon, FavoriteButton } from './Overlays'
import { useFavorites, useFavoritesRequest, takeFavoritesRequest } from '../store/favorites'

const CardView = lazy(() => import('../three/ProductViews').then((m) => ({ default: m.CardView })))

const FAV = 'Favorilerim'

function ProductCard({ product: base, index, shown, onOpen, onCustom }) {
  const { add } = useCart()
  const hovered = useRef(false)
  const ref = useRef()
  // kartta seçilen renk: 3D model ve ürün detayı bu rengi kullanır
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
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <button className="card__stage" onClick={() => onOpen(product)} aria-label={`${product.name} detay`}>
        <span className="card__index">{String(index + 1).padStart(2, '0')}</span>
        {product.sizes?.every((sz) => soldOut(product, sz)) ? (
          <span className="card__tag card__tag--out">Tükendi</span>
        ) : (
          product.tag && <span className="card__tag">{product.tag}</span>
        )}
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
          {product.price >= FREE_SHIPPING && <span className="card__ship">Ücretsiz kargo</span>}
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
                  onClick={() => setColor(hex)}
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

        <div className="collection">
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
