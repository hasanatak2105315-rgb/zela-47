import { useEffect, useState } from 'react'

// Bir öğe ekranda (ya da ekrana yakın) mı? 3D sahneler ekran dışındayken çizimi durdurur:
// görünmeyen bir sahneyi her karede çizmek tüm sayfayı yavaşlatıyordu
export function useOnScreen(getElement, margin = '150px') {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const el = getElement()
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [getElement, margin])
  return on
}
