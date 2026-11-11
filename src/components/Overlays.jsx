import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useCart, FREE_SHIPPING, CUSTOM_PRINT_FEE, unitPrice } from '../store/cart'
import { formatPrice, withColor, discount, soldOut } from '../data/products'
import { saveOrder } from '../store/admin'
import { currentUser } from '../store/auth'
import { lockScroll } from '../scroll'
import { navigate } from '../router'
import { whatsappLink } from '../data/site'
import { useFavorites, toggleFavorite } from '../store/favorites'
import { useBody, recommendedSize } from '../store/body'

const ProductStage = lazy(() => import('../three/ProductViews').then((m) => ({ default: m.ProductStage })))

const ease = [0.22, 1, 0.36, 1]

function useEscape(active, fn) {
  useEffect(() => {
    if (!active) return
    lockScroll(true)
    const onKey = (e) => e.key === 'Escape' && fn()
    window.addEventListener('keydown', onKey)
    return () => {
      lockScroll(false)
      window.removeEventListener('keydown', onKey)
    }
  }, [active, fn])
}

// Giyimde beden seçimi (seçilmeden sepete eklenmez). Ölçü girildiyse önerilen beden işaretlenir
export function SizePicker({ product, value, onChange, error }) {
  const recommended = recommendedSize(product, useBody())
  return (
    <div className={`sizes ${error ? 'sizes--error' : ''}`} role="radiogroup" aria-label="Beden">
      <span>Beden{recommended && <em> · ölçülerine göre önerilen: {recommended}</em>}</span>
      <div>
        {product.sizes.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={value === s}
            className={[value === s && 'active', recommended === s && 'recommended', soldOut(product, s) && 'soldout'].filter(Boolean).join(' ')}
            disabled={soldOut(product, s)}
            title={soldOut(product, s) ? `${s} beden tükendi` : undefined}
            onClick={() => onChange(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {error && <small role="alert">Önce bedenini seç.</small>}
    </div>
  )
}

// Renk seçimi: seçilen renk 3D modele anında uygulanır
export function ColorPicker({ product, value, onChange }) {
  const name = product.colors.find(([, hex]) => hex === value)?.[0]
  return (
    <div className="colors" role="radiogroup" aria-label="Renk">
      <span>
        Renk <b>{name}</b>
      </span>
      <div>
        {product.colors.map(([label, hex]) => (
          <button
            key={hex}
            type="button"
            role="radio"
            aria-checked={value === hex}
            aria-label={label}
            title={label}
            className={value === hex ? 'active' : ''}
            style={{ '--swatch': hex }}
            onClick={() => onChange(hex)}
          />
        ))}
      </div>
    </div>
  )
}

export const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </svg>
)

export function FavoriteButton({ id, className = '' }) {
  const on = useFavorites().includes(id)
  return (
    <button
      type="button"
      className={`fav-btn ${on ? 'fav-btn--on' : ''} ${className}`}
      aria-pressed={on}
      aria-label={on ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      onClick={() => toggleFavorite(id)}
    >
      <HeartIcon filled={on} />
    </button>
  )
}

// Paylaş: telefonda paylaşım menüsünü açar, bilgisayarda WhatsApp ile paylaşır
function share(product) {
  const url = window.location.origin
  const text = `${product.name} · ${formatPrice(product.price)} · ZELA 47`
  if (navigator.share) return navigator.share({ title: product.name, text, url }).catch(() => {})
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener')
}

export function ProductModal({ product, onClose, onCustom }) {
  const { add, setOpen } = useCart()
  const [qty, setQty] = useState(1)
  const [size, setSize] = useState(null)
  const [color, setColor] = useState(null)
  const [sizeError, setSizeError] = useState(false)
  useEscape(!!product, onClose)
  useEffect(() => {
    setQty(1)
    setSize(null)
    // kartta seçilen renk detayda da seçili gelir
    setColor(product?.color ?? null)
    setSizeError(false)
  }, [product])
  const shown = product && withColor(product, color)
  const colorName = product?.colors?.find(([, hex]) => hex === color)?.[0]
  const off = product ? discount(product) : 0

  return (
    <AnimatePresence>
      {product && (
        <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="modal__box"
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
          >
            <button className="icon-btn modal__close" onClick={onClose} aria-label="Kapat">
              ✕
            </button>
            <div className="modal__stage" role="img" aria-label={`${product.name} — sürükleyerek döndürülebilen 3D görünüm`}>
              <Suspense fallback={<div className="stage-loader" aria-hidden="true" />}>
                <ProductStage product={shown} />
              </Suspense>
              <span className="modal__hint">Döndürmek için sürükle</span>
            </div>
            <div className="modal__info">
              <small className="eyebrow">
                <span className="dot" /> {product.category}
              </small>
              <h2 className="display">{product.name}</h2>
              <div className="rating">★★★★★ <span>{product.rating}</span></div>
              <div className="price price--lg">
                {formatPrice(product.price)}
                {product.oldPrice && <s>{formatPrice(product.oldPrice)}</s>}
                {off > 0 && <em className="price__off">%{off} indirim</em>}
              </div>
              <p className="muted">{product.desc}</p>
              <ul className="specs">
                {product.specs.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              {product.colors && <ColorPicker product={product} value={color} onChange={setColor} />}
              {product.sizes && (
                <SizePicker
                  product={product}
                  value={size}
                  error={sizeError}
                  onChange={(s) => {
                    setSize(s)
                    setSizeError(false)
                  }}
                />
              )}
              <div className="modal__buy">
                <div className="qty">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Azalt">−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} aria-label="Artır">+</button>
                </div>
                <button
                  className="btn btn--primary btn--grow"
                  onClick={() => {
                    if (product.sizes && !size) return setSizeError(true)
                    add(product.id, qty, { size, color: colorName })
                    onClose()
                    setOpen(true)
                  }}
                >
                  Sepete Ekle · {formatPrice(product.price * qty)}
                </button>
                <FavoriteButton id={product.id} className="fav-btn--lg" />
              </div>
              <button className="btn btn--ghost btn--block custom-cta" onClick={() => onCustom(product)}>
                <PenIcon /> Kişiye Özel Baskı
              </button>
              <button className="share-btn" onClick={() => share(product)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6" />
                </svg>
                Arkadaşına öner
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---------------- Kişiye özel baskı ---------------- */

export const PenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" />
  </svg>
)

const PLACES = ['Ön', 'Arka', 'Ön ve arka']

// Kendi tasarımlarımıza ek olarak: ziyaretçinin yazısı ya da tasarım fikri ürüne basılır
export function CustomPrintModal({ product, onClose }) {
  const { add, setOpen } = useCart()
  const [size, setSize] = useState(null)
  const [place, setPlace] = useState(PLACES[0])
  const [text, setText] = useState('')
  const [errors, setErrors] = useState({})
  useEscape(!!product, onClose)
  useEffect(() => {
    setSize(null)
    setPlace(PLACES[0])
    setText('')
    setErrors({})
  }, [product])

  const clothing = !!product?.sizes
  const wa = product && whatsappLink(`Merhaba, ${product.name} için kişiye özel baskı tasarımımı göndermek istiyorum.`)

  const submit = (e) => {
    e.preventDefault()
    const found = {}
    if (clothing && !size) found.size = true
    if (text.trim().length < 2) found.text = 'Basılacak yazıyı ya da tasarım fikrini yaz.'
    setErrors(found)
    if (Object.keys(found).length) return
    add(product.id, 1, { size: size ?? undefined, custom: { text: text.trim(), place: clothing ? place : undefined } })
    onClose()
    setOpen(true)
  }

  return (
    <AnimatePresence>
      {product && (
        <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.form
            className="modal__box custom"
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            noValidate
            role="dialog"
            aria-modal="true"
            aria-label={`${product.name} kişiye özel baskı`}
          >
            <button type="button" className="icon-btn modal__close" onClick={onClose} aria-label="Kapat">
              ✕
            </button>
            <small className="eyebrow">
              <span className="dot" /> Kişiye özel baskı
            </small>
            <h2 className="display">{product.name}</h2>
            <p className="muted">
              Kendi tasarımlarımıza ek olarak, istediğin yazıyı, ismi, tarihi ya da çizimini bu ürüne basıyoruz. Üretime başlamadan önce sana bir önizleme
              gönderip onayını alıyoruz.
            </p>
            {clothing && (
              <SizePicker
                product={product}
                value={size}
                error={errors.size}
                onChange={(s) => {
                  setSize(s)
                  setErrors((x) => ({ ...x, size: undefined }))
                }}
              />
            )}
            {clothing && (
              <div className="sizes" role="radiogroup" aria-label="Baskı yeri">
                <span>Baskı yeri</span>
                <div>
                  {PLACES.map((p) => (
                    <button key={p} type="button" role="radio" aria-checked={place === p} className={place === p ? 'active' : ''} onClick={() => setPlace(p)}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className={`field ${errors.text ? 'field--error' : ''}`}>
              <span>Basılacak yazı ya da tasarım fikrin</span>
              <textarea
                rows={3}
                value={text}
                maxLength={200}
                placeholder="Ör. Ayşe 2026, takım logomuz, kendi çizimim"
                onChange={(e) => {
                  setText(e.target.value)
                  if (errors.text) setErrors((x) => ({ ...x, text: undefined }))
                }}
                aria-invalid={!!errors.text}
              />
              {errors.text && <small role="alert">{errors.text}</small>}
            </label>
            <p className="note">
              Görselin ya da logon varsa siparişten sonra{' '}
              {wa ? (
                <a href={wa} target="_blank" rel="noopener">
                  WhatsApp
                </a>
              ) : (
                'WhatsApp'
              )}{' '}
              ya da e-posta ile gönderebilirsin.
              {CUSTOM_PRINT_FEE > 0 && ` Kişiye özel baskı için ürün başına ${formatPrice(CUSTOM_PRINT_FEE)} eklenir.`}
            </p>
            <button className="btn btn--primary btn--block" type="submit">
              Sepete Ekle · {formatPrice(unitPrice(product, true))}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---------------- Ödeme formu ---------------- */

const digits = (v) => v.replace(/\D/g, '')

function checkoutErrors(f) {
  const e = {}
  if (f.name.trim().length < 2) e.name = 'Adını yaz.'
  if (f.surname.trim().length < 2) e.surname = 'Soyadını yaz.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Geçerli bir e-posta adresi yaz.'
  if (!/^(90)?0?5\d{9}$/.test(digits(f.phone))) e.phone = 'Telefonunu 05xx xxx xx xx şeklinde yaz.'
  if (f.address.trim().length < 15) e.address = 'Mahalle, sokak, no, ilçe ve il ile tam adresini yaz.'
  if (digits(f.card).length !== 16) e.card = 'Kart numarası 16 haneli olmalı.'
  const [mm, yy] = f.exp.split('/').map(Number)
  const now = new Date()
  const expired = 2000 + yy < now.getFullYear() || (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1)
  if (!/^\d{2}\/\d{2}$/.test(f.exp) || mm < 1 || mm > 12) e.exp = 'AA/YY şeklinde yaz.'
  else if (expired) e.exp = 'Kartının süresi dolmuş.'
  if (!/^\d{3,4}$/.test(f.cvc)) e.cvc = '3 ya da 4 haneli olmalı.'
  if (!f.agree) e.agree = 'Devam etmek için sözleşmeleri onaylamalısın.'
  return e
}

function Checkout({ total, onBack, onDone }) {
  const { lines, subtotal, shipping } = useCart()
  // Üye giriş yaptıysa bilgileri hazır gelir
  const [f, setF] = useState(() => {
    const u = currentUser()
    const parts = (u?.name ?? '').split(' ')
    return { name: parts.slice(0, -1).join(' ') || parts[0] || '', surname: parts.length > 1 ? parts[parts.length - 1] : '', email: u?.email ?? '', phone: u?.phone ?? '', address: u?.address ?? '', card: '', exp: '', cvc: '', agree: false }
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const format = {
    card: (v) => digits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '),
    exp: (v) => digits(v).slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2'),
    cvc: (v) => digits(v).slice(0, 4)
  }
  const set = (k) => (e) => {
    const v = k === 'agree' ? e.target.checked : format[k] ? format[k](e.target.value) : e.target.value
    setF((x) => ({ ...x, [k]: v }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }))
  }
  const err = (k) => errors[k] && <small role="alert">{errors[k]}</small>
  const cls = (k) => `field ${errors[k] ? 'field--error' : ''}`
  const input = (k, label, props = {}) => (
    <label className={cls(k)}>
      <span>{label}</span>
      <input value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />
      {err(k)}
    </label>
  )

  const submit = (e) => {
    e.preventDefault()
    const found = checkoutErrors(f)
    setErrors(found)
    if (Object.keys(found).length) {
      e.currentTarget.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus()
      return
    }
    setBusy(true)
    // Demo: gerçek ödeme yerine kısa bir bekleme
    setTimeout(() => {
      const order = { no: 'ZL-' + Math.floor(100000 + Math.random() * 900000), total, email: f.email.trim() }
      try {
        sessionStorage.setItem('last-order', JSON.stringify(order))
      } catch {}
      // Yönetim paneli için siparişin tamamı (kart bilgisi kaydedilmez)
      saveOrder({
        ...order,
        date: new Date().toISOString(),
        status: 'new',
        userId: currentUser()?.id,
        customer: { name: `${f.name.trim()} ${f.surname.trim()}`, email: f.email.trim(), phone: f.phone.trim(), address: f.address.trim() },
        items: lines.map((l) => ({ id: l.id, name: l.product.name, size: l.size, color: l.color, qty: l.qty, unit: unitPrice(l.product, l.custom), custom: l.custom })),
        subtotal,
        shipping
      })
      onDone()
      navigate('/tesekkurler')
    }, 1200)
  }

  return (
    <form className="checkout" onSubmit={submit} noValidate>
      <div className="row">
        {input('name', 'Ad', { name: 'name', autoComplete: 'given-name' })}
        {input('surname', 'Soyad', { name: 'surname', autoComplete: 'family-name' })}
      </div>
      {input('email', 'E-posta', { name: 'email', type: 'email', autoComplete: 'email' })}
      {input('phone', 'Telefon', { name: 'phone', type: 'tel', autoComplete: 'tel', placeholder: '05xx xxx xx xx' })}
      <label className={cls('address')}>
        <span>Teslimat adresi</span>
        <textarea name="address" rows={2} value={f.address} onChange={set('address')} autoComplete="street-address" aria-invalid={!!errors.address} />
        {err('address')}
      </label>
      {input('card', 'Kart numarası', { name: 'card', inputMode: 'numeric', autoComplete: 'cc-number', placeholder: '0000 0000 0000 0000' })}
      <div className="row">
        {input('exp', 'Son kullanma', { name: 'exp', inputMode: 'numeric', autoComplete: 'cc-exp', placeholder: 'AA/YY' })}
        {input('cvc', 'CVC', { name: 'cvc', inputMode: 'numeric', autoComplete: 'cc-csc', placeholder: '123' })}
      </div>
      <label className={`check ${errors.agree ? 'field--error' : ''}`}>
        <input type="checkbox" name="agree" checked={f.agree} onChange={set('agree')} />
        <span>
          <a href="/mesafeli-satis#on-bilgilendirme" target="_blank" rel="noopener">Ön Bilgilendirme Formu</a>’nu ve{' '}
          <a href="/mesafeli-satis" target="_blank" rel="noopener">Mesafeli Satış Sözleşmesi</a>’ni okudum, onaylıyorum.
        </span>
      </label>
      {err('agree')}
      <p className="note">
        Kişisel verilerin, siparişinin yürütülmesi amacıyla{' '}
        <a href="/kvkk" target="_blank" rel="noopener">KVKK Aydınlatma Metni</a>’nde açıklandığı şekilde işlenir.
      </p>
      <p className="note">Bu bir demo ödeme formudur, gerçek ödeme alınmaz.</p>
      <div className="totals">
        <div className="grand">
          <span>Toplam</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
      <button className="btn btn--primary btn--block" type="submit" disabled={busy} aria-busy={busy}>
        {busy ? <><span className="spinner" aria-hidden="true" /> Ödeme işleniyor…</> : 'Siparişi Onayla'}
      </button>
      <button type="button" className="btn btn--ghost btn--block" onClick={onBack} disabled={busy}>
        Sepete dön
      </button>
    </form>
  )
}

export function CartDrawer() {
  const { open, setOpen, lines, subtotal, shipping, total, setQty, clear } = useCart()
  const [step, setStep] = useState('cart')
  const close = () => setOpen(false)
  useEscape(open, close)
  useEffect(() => {
    if (!open) setStep('cart')
  }, [open])

  const left = FREE_SHIPPING - subtotal

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.aside
            className="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease }}
            aria-label="Sepet"
          >
            <div className="drawer__head">
              <h3 className="display">{step === 'checkout' ? 'Ödeme' : 'Sepetin'}</h3>
              <button className="icon-btn" onClick={close} aria-label="Kapat">
                ✕
              </button>
            </div>

            {step === 'checkout' ? (
              <Checkout total={total} onBack={() => setStep('cart')} onDone={() => { clear(); close() }} />
            ) : (
              <>
                <div className="drawer__body">
                  {lines.length === 0 ? (
                    <div className="empty">
                      <p className="display">Sepetin boş</p>
                      <p className="muted">Koleksiyona göz at ve sana uygun parçayı seç.</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {lines.map((l) => (
                        <motion.div
                          key={l.key}
                          className="line"
                          layout
                          initial={{ opacity: 0, x: 40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 40 }}
                        >
                          <div className="line__thumb">
                            {l.custom?.previews ? (
                              Object.values(l.custom.previews).map((src, i) => <img key={i} src={src} alt="" />)
                            ) : (
                              l.product.name.split(' ').map((w) => w[0]).join('').slice(0, 2)
                            )}
                          </div>
                          <div className="line__info">
                            <strong>{l.product.name}</strong>
                            {(l.size || l.color || l.custom) && (
                              <small className="line__opts">
                                {[l.color, l.size && `Beden ${l.size}`, l.custom && `Kişiye özel${l.custom.place ? ` (${l.custom.place})` : ''}: “${l.custom.text}”`]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </small>
                            )}
                            <span className="muted">{formatPrice(unitPrice(l.product, l.custom))}</span>
                            <div className="qty qty--sm">
                              <button onClick={() => setQty(l.key, l.qty - 1)} aria-label="Azalt">−</button>
                              <span>{l.qty}</span>
                              <button onClick={() => setQty(l.key, l.qty + 1)} aria-label="Artır">+</button>
                            </div>
                          </div>
                          <button className="line__remove" onClick={() => setQty(l.key, 0)}>
                            Kaldır
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
                <div className="drawer__foot">
                  {subtotal > 0 && (
                    <div className="ship">
                      <div className="ship__bar">
                        <span style={{ transform: `scaleX(${Math.min(subtotal / FREE_SHIPPING, 1)})` }} />
                      </div>
                      <small className="muted">
                        {left > 0 ? `Ücretsiz kargo için ${formatPrice(left)} daha ekle` : 'Kargo bizden 🎉'}
                      </small>
                    </div>
                  )}
                  <div className="totals">
                    <div>
                      <span>Ara toplam</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div>
                      <span>Kargo</span>
                      <span>{shipping ? formatPrice(shipping) : 'Ücretsiz'}</span>
                    </div>
                    <div className="grand">
                      <span>Toplam</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                  <button className="btn btn--primary btn--block" disabled={!lines.length} onClick={() => setStep('checkout')}>
                    Ödemeye Geç
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export function Toast() {
  const { toast } = useCart()
  return (
    <AnimatePresence>
      {toast && (
        <motion.div className="toast" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
          <span className="dot" /> {toast}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
