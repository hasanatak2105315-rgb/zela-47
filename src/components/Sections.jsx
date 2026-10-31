import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Logo } from './Navbar'
import { Link, goToSection } from '../router'
import { SITE } from '../data/site'

const ease = [0.22, 1, 0.36, 1]

export function Marquee() {
  const items = ['Ücretsiz kargo 1.500 ₺ üzeri', 'Kendi tasarımımız', 'Kişiye özel baskı', 'Hediye paketinde', '30 gün koşulsuz iade', 'Sınırlı üretim']
  const row = [...items, ...items]
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {[0, 1].map((k) => (
          <div key={k} className="marquee__group">
            {row.map((t, i) => (
              <span key={i}>
                {t} <i>✦</i>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function Word({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.12, 1])
  const color = useTransform(progress, range, ['#8a7563', '#2b1b14'])
  return (
    <motion.span style={{ opacity, color }} className="word">
      {children}{' '}
    </motion.span>
  )
}

// Kaydırdıkça kelime kelime aydınlanan manifesto
export function Story() {
  const ref = useRef()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.55'] })
  const text =
    'Biz seri üretimin peşinde değiliz. Her baskıyı tek tek kontrol eder, her kumaşı elimizle seçer ve hiçbir parçayı özenle bakmadan paketlemeyiz. Giydiğin bir tişört ya da eşofman tek bir şey için var: Senin hikâyeni anlatmak.'
  const words = text.split(' ')
  return (
    <section className="section story" id="hikaye">
      <div className="container">
        <p className="eyebrow">
          <span className="dot" /> Manifesto
        </p>
        <p ref={ref} className="story__text">
          {words.map((w, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {w}
            </Word>
          ))}
        </p>
        <div className="stats">
          {[
            ['%100', 'Pamuk tişörtler'],
            ['30 gün', 'Koşulsuz iade'],
            ['4.9/5', 'Müşteri puanı'],
            ['1–3 gün', 'İçinde kargoda']
          ].map(([a, b], i) => (
            <motion.div
              key={a}
              className="stat"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5, ease }}
            >
              <strong>{a}</strong>
              <span>{b}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const FEATURES = [
  {
    title: 'Hızlı Teslimat',
    text: 'Stoktaki ürünler 1–3 iş gününde kargoda, hepsi hediye kutusunda. 1.500 ₺ üzeri kargo bizden.',
    icon: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
  },
  {
    title: 'Kişiye Özel',
    text: 'İsim, tarih ya da kendi çizimin. Tişörtünü ve eşofmanını sana özel basıyoruz.',
    icon: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" />
  },
  {
    title: 'Güvenli Ödeme',
    text: '256-bit SSL ile şifrelenmiş ödeme. Kart bilgilerin bizde saklanmaz.',
    icon: <path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4" />
  }
]

export function Features() {
  return (
    <section className="section" id="avantajlar">
      <div className="container">
        <div className="features">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="feature"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.06, duration: 0.5, ease }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
                {f.icon}
              </svg>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function BigBanner() {
  const ref = useRef()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x = useTransform(scrollYProgress, [0, 1], ['10%', '-35%'])
  return (
    <section ref={ref} className="banner" aria-hidden="true">
      <motion.div style={{ x }} className="banner__text">
        Sana özel üretildi — Sana özel üretildi —
      </motion.div>
    </section>
  )
}

export function Newsletter() {
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  return (
    <section className="section" id="bulten">
      <div className="container">
        <motion.div
          className="newsletter"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease }}
        >
          <p className="eyebrow">
            <span className="dot" /> Bültene Katıl
          </p>
          <h2 className="display">
            İlk siparişte <em>%10</em> indirim
          </h2>
          <p className="muted">Yeni seriler, sınırlı üretimler ve özel kampanyalar önce bülten üyelerine.</p>
          {sent ? (
            <p className="newsletter__ok">✓ Kaydın alındı. Aramıza hoş geldin.</p>
          ) : (
            <>
              <form
                noValidate
                className={error ? 'newsletter__form--error' : ''}
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Geçerli bir e-posta adresi yaz.')
                  setSent(true)
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="E-posta adresin"
                  aria-label="E-posta"
                  aria-invalid={!!error}
                  autoComplete="email"
                />
                <button className="btn btn--primary" type="submit">
                  Katıl
                </button>
              </form>
              {error && <p className="newsletter__err" role="alert">{error}</p>}
              <p className="newsletter__legal">
                Katılarak kampanya e-postaları almayı kabul edersin, istediğin an ayrılabilirsin. <Link to="/gizlilik">Gizlilik</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </section>
  )
}

// Ana sayfanın kapanışı: ziyaretçiyi yeniden alışverişe döndürür
export function Closing() {
  return (
    <section className="section closing" id="kapanis">
      <div className="container">
        <motion.div
          className="page__cta"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease }}
        >
          <h2 className="display">
            Sıradaki imza <em>senin.</em>
          </h2>
          <p className="muted">Koleksiyondan seç ya da aklındaki tasarımı birlikte basalım.</p>
          <div className="hero__cta">
            <button className="btn btn--primary" onClick={() => goToSection('koleksiyon')}>
              Koleksiyonu Keşfet
            </button>
            <Link className="btn btn--ghost" to="/iletisim">
              Kişiye Özel Baskı
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div>
            <Logo />
            <p className="muted">Baskılı tişört ve eşofman. Tokat, Türkiye.</p>
          </div>
          <div className="footer__cols">
            <div>
              <h4>Mağaza</h4>
              <button onClick={() => goToSection('koleksiyon')}>Koleksiyon</button>
              <Link to="/hakkimizda">Hakkımızda</Link>
            </div>
            <div>
              <h4>Yardım</h4>
              <Link to="/sss">Sıkça sorulanlar</Link>
              <Link to="/iade">İade ve değişim</Link>
              <Link to="/kvkk">KVKK</Link>
            </div>
            <div>
              <h4>İletişim</h4>
              <Link to="/iletisim">İletişim formu</Link>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              {SITE.instagram && (
                <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="footer__giant" aria-hidden="true">
          ZELA 47
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} ZELA 47. Tüm hakları saklıdır.</span>
          <span>
            <Link to="/kvkk">KVKK</Link> · <Link to="/gizlilik">Gizlilik ve Çerezler</Link> · <Link to="/kullanim-kosullari">Kullanım Koşulları</Link> ·{' '}
            <Link to="/mesafeli-satis">Mesafeli Satış Sözleşmesi</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
