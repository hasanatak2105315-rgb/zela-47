import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useCart } from '../store/cart'
import { formatPrice } from '../data/products'
import { SITE, whatsappLink } from '../data/site'
import { Link, goToSection, usePath } from '../router'

const ease = [0.22, 1, 0.36, 1]

/* ---------------- Sabit mobil buton ---------------- */

// Telefonda, giriş ekranı geçildikten sonra altta sabit duran buton.
// Sepette ürün varsa sepeti açar, yoksa koleksiyona götürür.
export function MobileCta() {
  const { count, total, setOpen, open } = useCart()
  const path = usePath()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [path])

  const visible = show && !open && path !== '/tesekkurler' && path !== '/tasarla'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="mobile-cta"
          initial={{ y: '120%' }}
          animate={{ y: 0 }}
          exit={{ y: '120%' }}
          transition={{ duration: 0.3, ease }}
        >
          {count > 0 ? (
            <button className="btn btn--primary btn--block" onClick={() => setOpen(true)}>
              Sepete Git · {count} ürün · {formatPrice(total)}
            </button>
          ) : (
            <button className="btn btn--primary btn--block" onClick={() => goToSection('koleksiyon')}>
              Koleksiyonu Keşfet
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---------------- WhatsApp destek hattı ---------------- */

export const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
)

// Sağ altta sabit duran destek butonu. site.js içinde whatsapp numarası yoksa görünmez
export function WhatsAppButton() {
  const href = whatsappLink('Merhaba, ZELA 47 sitesinden yazıyorum.')
  // tasarım stüdyosunda sağ alttaki "Sepete Ekle" butonunun üstüne biniyordu
  const path = usePath()
  if (!href || path === '/tasarla') return null
  return (
    <a className="wa-btn" href={href} target="_blank" rel="noopener" aria-label="WhatsApp destek hattı">
      <WhatsAppIcon />
      <span>WhatsApp Destek</span>
    </a>
  )
}

/* ---------------- Çerez bandı ve Google Analytics ---------------- */

const CONSENT_KEY = 'cookie-consent'

const readConsent = () => {
  try {
    return localStorage.getItem(CONSENT_KEY)
  } catch {
    return null
  }
}

let gaLoaded = false
function loadAnalytics(id) {
  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    window.dataLayer.push(arguments)
  }
  if (gaLoaded) return window.gtag('consent', 'update', { analytics_storage: 'granted' })
  gaLoaded = true
  window.gtag('js', new Date())
  // Sayfa görüntülemelerini adres değiştikçe kendimiz gönderiyoruz
  window.gtag('config', id, { send_page_view: false, anonymize_ip: true })
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(s)
}

// Analytics kimliği girilmemişse hiçbir şey göstermez ve hiçbir şey yüklemez
export function CookieBanner() {
  const id = SITE.analyticsId
  const path = usePath()
  const [consent, setConsent] = useState(readConsent)
  const [open, setOpen] = useState(() => !!id && !readConsent())

  useEffect(() => {
    if (id && consent === 'granted') loadAnalytics(id)
  }, [id, consent])

  useEffect(() => {
    if (id && consent === 'granted' && window.gtag) {
      window.gtag('event', 'page_view', { page_path: path, page_title: document.title, page_location: window.location.href })
    }
  }, [id, consent, path])

  useEffect(() => {
    const reopen = () => setOpen(true)
    window.addEventListener('cookie-settings', reopen)
    return () => window.removeEventListener('cookie-settings', reopen)
  }, [])

  const choose = (value) => {
    try {
      localStorage.setItem(CONSENT_KEY, value)
    } catch {}
    if (value === 'denied' && window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' })
    setConsent(value)
    setOpen(false)
  }

  if (!id) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cookie"
          role="dialog"
          aria-label="Çerez tercihleri"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.35, ease }}
        >
          <p>
            Siteyi geliştirmek için, izin verirsen anonim ziyaret istatistikleri topluyoruz. Sepetin gibi zorunlu bilgiler her durumda saklanır.{' '}
            <Link to="/gizlilik">Ayrıntılar</Link>
          </p>
          <div className="cookie__actions">
            <button className="btn btn--ghost" onClick={() => choose('denied')}>
              Reddet
            </button>
            <button className="btn btn--primary" onClick={() => choose('granted')}>
              Kabul et
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
