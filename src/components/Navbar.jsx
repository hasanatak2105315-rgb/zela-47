import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useCart, FREE_SHIPPING } from '../store/cart'
import { getSettings } from '../store/admin'
import { useUser } from '../store/auth'
import { useFavorites, requestFavorites } from '../store/favorites'
import { formatPrice } from '../data/products'
import { HeartIcon } from './Overlays'
import { goToSection, navigate } from '../router'

// '#' ile başlayanlar ana sayfadaki bölümler, '/' ile başlayanlar ayrı sayfalar
const LINKS = [
  ['#koleksiyon', 'Koleksiyon'],
  ['/tasarla', 'Tasarla'],
  ['/hakkimizda', 'Hakkımızda'],
  ['/sss', 'SSS'],
  ['/iletisim', 'İletişim']
]

// Logo (ZELA 47): Roma zafer çelengi içinde 3D yazıcıdan çıkmış gibi katman katman basılmış Z, altta 47.
// Hikâye: Sezar "Veni, vidi, vici" sözünü M.Ö. 47'de Zela'da (bugünkü Zile, Tokat) söyledi.
// favicon.svg ve paylaşım görseli de aynı çizimi kullanır
const Z = 'M36 32H84V45L56 75H84V88H36V75L64 45H36Z'
const LAYERS = [
  [6, '#6e1a15'],
  [4, '#d4a23a'],
  [2, '#8f241d'],
  [0, '#c8382e']
]
// Çelenk: merkez (60,60), yarıçap 50; sol dal aşağıdan yukarı, sağ dal aynası
const R = 50
const at = (deg, r = R) => [60 + r * Math.cos((deg * Math.PI) / 180), 60 + r * Math.sin((deg * Math.PI) / 180)]
// [açı, dala uzaklık (+ dış / - iç), eğim]: yapraklar çift çift, dalın büyüdüğü yöne doğru; sonda uç yaprağı
const LEAVES = [
  [128, 5, -32], [136, -5, 32], [150, 5, -32], [158, -5, 32], [172, 5, -32], [180, -5, 32],
  [194, 5, -32], [202, -5, 32], [216, 5, -32], [224, -5, 32], [238, 4, -25], [246, -4, 25], [256, 0, 0]
]
const [sx, sy] = at(118)
const [ex, ey] = at(250)
const STEM = `M${sx} ${sy}A${R} ${R} 0 0 1 ${ex} ${ey}`

function Branch({ animated, mirror }) {
  return (
    <g transform={mirror ? 'translate(120 0) scale(-1 1)' : undefined}>
      <path d={STEM} fill="none" stroke="#d4a23a" strokeWidth="2" strokeLinecap="round" />
      {LEAVES.map(([deg, off, tilt], i) => {
        const [x, y] = at(deg, R + off)
        return (
          <motion.ellipse
            key={deg}
            cx={x}
            cy={y}
            rx="7"
            ry="2.9"
            fill={off > 0 ? '#d4a23a' : '#a87a1c'}
            transform={`rotate(${deg + 90 + tilt} ${x} ${y})`}
            initial={animated ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 + i * 0.03, duration: 0.25 }}
          />
        )
      })}
    </g>
  )
}

// animated: çelenk yaprakları sırayla belirir, Z'nin katmanları tek tek "basılır" (açılış ekranı)
export function ZMark({ className, animated = false }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <Branch animated={animated} />
      <Branch animated={animated} mirror />
      {LAYERS.map(([d, fill], i) => (
        <motion.g
          key={d}
          initial={animated ? { opacity: 0, y: -8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.07, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <path d={Z} transform={`translate(${d} ${d})`} fill={fill} stroke={d ? '#f7f0e3' : 'none'} strokeWidth="0.7" />
        </motion.g>
      ))}
      <path d="M41 37H79" stroke="#fff3e0" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <text x="60" y="115" textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize="15" letterSpacing="1" fill="#2b1b14">
        47
      </text>
    </svg>
  )
}

// Üstteki duyuru bandı: kampanyalar sırayla döner. Sayfa kaydırılınca bant kapanır
export const DEFAULT_NOTICES = [
  `${formatPrice(FREE_SHIPPING)} ve üzeri alışverişte ücretsiz kargo`,
  'Bültene katıl, ilk siparişinde %10 indirim',
  '30 gün içinde koşulsuz iade'
]
// Yönetim panelinden değiştirilebilir (boş satırlar atlanır)
const NOTICES = (getSettings().notices ?? []).filter((t) => t.trim()).length ? getSettings().notices.filter((t) => t.trim()) : DEFAULT_NOTICES

function Topbar() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % NOTICES.length), 4000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="topbar" aria-live="polite">
      <motion.span key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        {NOTICES[i]}
      </motion.span>
      <a className="topbar__link" href="/siparis-takibi" onClick={(e) => (e.preventDefault(), navigate('/siparis-takibi'))}>
        Sipariş Takibi
      </a>
    </div>
  )
}

// Menüde ve alt kısımda yalnızca işaret durur (yanında yazı yok)
export function Logo() {
  return (
    <span className="logo" title="ZELA 47">
      <ZMark />
      <span className="sr-only">ZELA 47</span>
    </span>
  )
}

export default function Navbar() {
  const { count, setOpen } = useCart()
  const favCount = useFavorites().length
  const user = useUser()
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (to) => {
    setMenu(false)
    to.startsWith('#') ? goToSection(to.slice(1)) : navigate(to)
  }

  return (
    <motion.header
      className={`nav ${scrolled ? 'nav--solid' : ''} ${menu ? 'nav--open' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Topbar />
      <div className="container nav__inner">
        <a href="/" aria-label="Ana sayfa" onClick={(e) => { e.preventDefault(); setMenu(false); navigate('/') }}>
          <Logo />
        </a>
        <nav className="nav__links">
          {LINKS.map(([to, label]) => (
            <button key={to} onClick={() => go(to)}>
              {label}
            </button>
          ))}
          <button className="nav__auth" onClick={() => go('/siparis-takibi')}>
            Sipariş Takibi
          </button>
          {/* Telefon menüsünde üyelik bağlantıları (bilgisayarda sağdaki butonlar var) */}
          {user ? (
            <button className="nav__auth" onClick={() => go('/hesabim')}>
              Hesabım
            </button>
          ) : (
            <>
              <button className="nav__auth nav__auth--main" onClick={() => go('/kayit')}>
                Kayıt Ol
              </button>
              <button className="nav__auth" onClick={() => go('/giris')}>
                Giriş Yap
              </button>
            </>
          )}
        </nav>
        <div className="nav__actions">
          {!user && (
            <button className="signup-btn" onClick={() => go('/kayit')}>
              Kayıt Ol
            </button>
          )}
          <button
            className={`fav-nav user-nav ${user ? 'user-nav--in' : ''}`}
            onClick={() => {
              setMenu(false)
              navigate(user ? '/hesabim' : '/giris')
            }}
            aria-label={user ? `Hesabım (${user.name})` : 'Giriş yap ya da kayıt ol'}
            title={user ? 'Hesabım' : 'Giriş yap'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
            </svg>
          </button>
          <button
            className="fav-nav"
            onClick={() => {
              setMenu(false)
              requestFavorites()
              goToSection('koleksiyon')
            }}
            aria-label={`Favorilerim (${favCount})`}
          >
            <HeartIcon filled={favCount > 0} />
            {favCount > 0 && <b>{favCount}</b>}
          </button>
          <button className="cart-btn" onClick={() => setOpen(true)} aria-label="Sepeti aç">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 7h12l-1 13H7L6 7Z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            <span>Sepet</span>
            <motion.b key={count} initial={{ scale: 1.6 }} animate={{ scale: 1 }}>
              {count}
            </motion.b>
          </button>
          <button className="burger" onClick={() => setMenu((m) => !m)} aria-label="Menü">
            <i />
            <i />
          </button>
        </div>
      </div>
    </motion.header>
  )
}
