import { useSyncExternalStore } from 'react'

// Favori ürünler (ürün kimlikleri). Tarayıcıda saklanır, üyelik gerekmez.
const KEY = 'zela-favs'
let favs = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []
  }
})()
// Menüdeki kalp butonu koleksiyonda "Favorilerim" filtresini açtırır
let wanted = false
const subs = new Set()
const emit = () => subs.forEach((fn) => fn())

export function toggleFavorite(id) {
  favs = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id]
  try {
    localStorage.setItem(KEY, JSON.stringify(favs))
  } catch {}
  emit()
}

export function requestFavorites() {
  wanted = true
  emit()
}

// Koleksiyon isteği bir kez okur
export function takeFavoritesRequest() {
  const w = wanted
  wanted = false
  return w
}

const subscribe = (fn) => {
  subs.add(fn)
  return () => subs.delete(fn)
}

export const useFavorites = () => useSyncExternalStore(subscribe, () => favs)
export const useFavoritesRequest = () => useSyncExternalStore(subscribe, () => wanted)
