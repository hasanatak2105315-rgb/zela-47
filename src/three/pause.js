import { useSyncExternalStore } from 'react'

// Ürün detayı gibi bir pencere açıkken arkadaki 3D sahneler (giriş, ürün kartları) durur.
// Aynı anda üç sahne çizmek pencere açılınca ekranı takıyordu
let count = 0
const subs = new Set()
const emit = () => subs.forEach((f) => f())
export function pauseBackground() {
  count++
  emit()
  return () => {
    count--
    emit()
  }
}
const subscribe = (f) => (subs.add(f), () => subs.delete(f))
export const usePaused = () => useSyncExternalStore(subscribe, () => count > 0)
