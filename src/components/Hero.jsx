import { lazy, Suspense } from 'react'
import { motion } from 'motion/react'
import { scrollToId } from '../scroll'

const HeroScene = lazy(() => import('../three/HeroScene'))

const ease = [0.22, 1, 0.36, 1]

function Line({ children, delay, ready }) {
  return (
    <span className="reveal-line">
      <motion.span initial={{ y: '105%' }} animate={ready ? { y: 0 } : {}} transition={{ delay, duration: 0.6, ease }}>
        {children}
      </motion.span>
    </span>
  )
}

export default function Hero({ ready }) {
  const d = 0.1
  return (
    <section className="hero">
      <div className="hero__canvas" role="img" aria-label="Işık altında dönen, göğsünde marka baskısı olan tişört">
        <Suspense fallback={<div className="stage-loader" aria-hidden="true" />}>
          <HeroScene />
        </Suspense>
      </div>
      <div className="hero__shade" />

      <div className="container hero__content">
        <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : {}} transition={{ delay: d, duration: 0.5 }}>
          <span className="dot" /> Sezon 01 — Baskılı Koleksiyon
        </motion.p>
        <h1 className="hero__title">
          <Line ready={ready} delay={d + 0.05}>Tarzın</Line>
          <Line ready={ready} delay={d + 0.11}>
            <em>bir detay</em> değil,
          </Line>
          <Line ready={ready} delay={d + 0.17}>bir imza.</Line>
        </h1>
        <motion.p
          className="hero__lead"
          initial={{ opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: d + 0.3, duration: 0.55, ease }}
        >
          Kendi tasarımlarımızla baskılı tişörtler ve eşofmanlar. İstersen adını, tarihini ya da kendi çizimini de basıyoruz.
        </motion.p>
        <motion.div
          className="hero__cta"
          initial={{ opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: d + 0.38, duration: 0.55, ease }}
        >
          <button className="btn btn--primary" onClick={() => scrollToId('koleksiyon')}>
            Koleksiyonu Keşfet
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
          <button className="btn btn--ghost" onClick={() => scrollToId('hikaye')}>
            Hikâyemiz
          </button>
        </motion.div>
      </div>

      <motion.div className="hero__meta container" initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : {}} transition={{ delay: d + 0.5, duration: 0.5 }}>
        <div>
          <small>Öne çıkan</small>
          <strong>Baskılı Tişört</strong>
        </div>
        <div className="scroll-hint">
          <span />
          Kaydır
        </div>
        <div className="hero__coords">
          <small>Atölye</small>
          <strong>40.3139° N, 36.5544° E</strong>
        </div>
      </motion.div>
    </section>
  )
}
