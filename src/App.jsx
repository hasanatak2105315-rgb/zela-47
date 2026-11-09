import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Collection from './components/Collection'
import { Marquee, Story, Features, BigBanner, Newsletter, Closing, Footer } from './components/Sections'
import { ProductModal, CustomPrintModal, CartDrawer, Toast } from './components/Overlays'
import Designer from './components/Designer'
import { About, Contact, Faq, Returns, Kvkk, Privacy, Terms, DistanceSales, ThankYou, NotFound } from './components/Pages'
import { MobileCta, CookieBanner, WhatsAppButton } from './components/Extras'
import { usePath, navigate } from './router'
import { DESIGN_PRODUCTS } from './data/designer'
import { applyMeta } from './meta'
import { CartProvider } from './store/cart'
import { startSmoothScroll } from './scroll'

// 3D kodu ana dosyadan ayrı, sonradan yüklenir
const ViewsCanvas = lazy(() => import('./three/ProductViews').then((m) => ({ default: m.ViewsCanvas })))

const PAGES = {
  '/hakkimizda': About,
  '/tasarla': Designer,
  '/iletisim': Contact,
  '/sss': Faq,
  '/iade': Returns,
  '/kvkk': Kvkk,
  '/gizlilik': Privacy,
  '/kullanim-kosullari': Terms,
  '/mesafeli-satis': DistanceSales,
  '/tesekkurler': ThankYou
}

export default function App() {
  const path = usePath()
  const Page = path === '/' ? null : PAGES[path] ?? NotFound
  const [selected, setSelected] = useState(null)
  const [customFor, setCustomFor] = useState(null)

  useEffect(() => startSmoothScroll(), [])
  useEffect(() => applyMeta(path), [path])

  const closeModal = useCallback(() => setSelected(null), [])
  const closeCustom = useCallback(() => setCustomFor(null), [])
  // Tasarım stüdyosunda olan ürünler stüdyoya gider, diğerleri kısa baskı formunu açar
  const openCustom = useCallback((product) => {
    setSelected(null)
    if (DESIGN_PRODUCTS[product.id]) navigate(`/tasarla?urun=${product.id}&renk=${encodeURIComponent(product.color)}`)
    else setCustomFor(product)
  }, [])

  return (
    <CartProvider>
      <div className="grain" aria-hidden="true" />
      <Navbar />
      <main>
        {Page ? (
          <Page />
        ) : (
          <>
            <Hero ready />
            <Marquee />
            <Collection onOpen={setSelected} onCustom={openCustom} />
            <BigBanner />
            <Story />
            <Features />
            <Newsletter />
            <Closing />
          </>
        )}
      </main>
      <Footer />
      {!Page && (
        <Suspense fallback={null}>
          <ViewsCanvas />
        </Suspense>
      )}
      <MobileCta />
      <WhatsAppButton />
      <CartDrawer />
      <ProductModal product={selected} onClose={closeModal} onCustom={openCustom} />
      <CustomPrintModal product={customFor} onClose={closeCustom} />
      <Toast />
      <CookieBanner />
    </CartProvider>
  )
}
