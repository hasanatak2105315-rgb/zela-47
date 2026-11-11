import { useSyncExternalStore } from 'react'

// Ziyaretçinin beden ölçüleri ve manken seçimi (kadın/erkek): manken bu ölçülere göre şekillenir
// ve beden önerilir. Ölçüler tarayıcıda saklanır. Varsayılanlar seçili mankenin kendi ölçüleridir.

const KEY = 'tx-body'

export const GENDERS = [
  { key: 'female', label: 'Kadın' },
  { key: 'male', label: 'Erkek' }
]

export const FIELDS = [
  { key: 'height', label: 'Boy', unit: 'cm', min: 150, max: 200 },
  { key: 'weight', label: 'Kilo', unit: 'kg', min: 45, max: 120 },
  { key: 'chest', label: 'Göğüs', unit: 'cm', min: 76, max: 130 },
  { key: 'waist', label: 'Bel', unit: 'cm', min: 58, max: 120 },
  { key: 'hip', label: 'Kalça', unit: 'cm', min: 84, max: 130 }
]

// Mankenlerin kendi ölçüleri
export const BASES = {
  female: { height: 166, weight: 58, chest: 88, waist: 68, hip: 96 },
  male: { height: 178, weight: 74, chest: 98, waist: 82, hip: 98 }
}

const defaults = (gender) => ({ ...BASES[gender], gender, custom: false })

const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved) {
      const gender = BASES[saved.gender] ? saved.gender : 'female'
      return { ...defaults(gender), ...saved, gender, open: false }
    }
  } catch {}
  return { ...defaults('female'), open: false }
}

let state = load()
const subs = new Set()
const emit = () => subs.forEach((fn) => fn())

const save = () => {
  try {
    const { open, ...rest } = state
    // ölçü girilmediyse yalnızca manken seçimi saklanır
    localStorage.setItem(KEY, JSON.stringify(rest.custom ? rest : { gender: rest.gender }))
  } catch {}
}

export const getBody = () => state

export function setBody(patch) {
  state = { ...state, ...patch, custom: true }
  save()
  emit()
}

export function resetBody() {
  state = { ...defaults(state.gender), open: state.open }
  save()
  emit()
}

// Kadın/erkek manken. Ölçü girilmediyse yeni mankenin kendi ölçülerine geçilir
export function setGender(gender) {
  state = state.custom ? { ...state, gender } : { ...defaults(gender), open: state.open }
  save()
  emit()
}

// Ölçü paneli açık mı (açıkken manken tam boy gösterilir)
export function setBodyOpen(open) {
  state = { ...state, open }
  emit()
}

const subscribe = (fn) => {
  subs.add(fn)
  return () => subs.delete(fn)
}

export const useBody = () => useSyncExternalStore(subscribe, getBody)

// Örnek beden tablosu: üstlerde göğüs, altlarda kalça çevresine göre (cm, üst sınırlar)
export const SIZE_TABLES = {
  female: {
    tops: [['S', 88], ['M', 94], ['L', 100], ['XL', 106], ['XXL', Infinity]],
    bottoms: [['S', 96], ['M', 102], ['L', 108], ['XL', 114], ['XXL', Infinity]],
    waistGap: 26
  },
  male: {
    tops: [['S', 93], ['M', 100], ['L', 107], ['XL', 114], ['XXL', Infinity]],
    bottoms: [['S', 95], ['M', 101], ['L', 107], ['XL', 113], ['XXL', Infinity]],
    waistGap: 18
  }
}
const pick = (table, v) => table.find(([, max]) => v <= max)[0]
const tableOf = (b) => SIZE_TABLES[b.gender] ?? SIZE_TABLES.female

export const topSize = (b) => pick(tableOf(b).tops, b.chest)
export const bottomSize = (b) => pick(tableOf(b).bottoms, Math.max(b.hip, b.waist + tableOf(b).waistGap))

// Ürün için önerilen beden (ölçü girilmediyse ya da beden yoksa null)
export function recommendedSize(product, b = state) {
  if (!b.custom || !product?.sizes) return null
  return product.model === 'joggers' ? bottomSize(b) : topSize(b)
}
