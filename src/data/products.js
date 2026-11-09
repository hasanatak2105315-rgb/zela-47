// Ürün listesi — ad, fiyat, açıklama ve 3D modeli buradan düzenleyin.
// model: src/three/Models.jsx içindeki modellerden biri
// (tshirt, sweatshirt, hoodie, joggers, tracksuit; 3D baskı modelleri de duruyor ama şu an satılmıyor)
// color = kumaş rengi, color2 = eşofman takımının altı, print = göğüsteki baskı yazısı,
// sizes = beden seçenekleri (varsa sepete eklemeden önce beden seçilir),
// colors = renk seçenekleri [ad, renk kodu]; ilki varsayılan renktir ve color ile aynı olmalı

import { getProductEdits } from '../store/admin'

export const CATEGORIES = ['Tümü', 'Tişört', 'Eşofman']

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']
// Yönetim panelinde seçilebilen tüm bedenler
export const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

// Kodda yazılı hâli (panelde "varsayılana dön" için)
export const BASE_PRODUCTS = [
  {
    id: 'baskili-tisort',
    name: 'Baskılı Tişört',
    category: 'Tişört',
    model: 'tshirt',
    color: '#f1ece2',
    colors: [['Krem', '#f1ece2'], ['Pompeii kırmızısı', '#b8322a'], ['Siyah', '#221c19']],
    print: 'Zela 47',
    sizes: SIZES,
    price: 449,
    oldPrice: 549,
    rating: 4.9,
    tag: 'Çok Satan',
    desc: 'Yumuşak penye kumaş üzerine kendi tasarımımız olan göğüs baskısı. Rahat kesim, günlük kullanım için ideal.',
    specs: ['%100 pamuk', '180 g/m² penye', 'Solmayan DTF baskı', 'Unisex kesim']
  },
  {
    id: 'esofman-alti',
    name: 'Eşofman Altı',
    category: 'Eşofman',
    model: 'joggers',
    color: '#9aa3ab',
    colors: [['Gri melanj', '#9aa3ab'], ['Siyah', '#221c19'], ['Lacivert', '#2c4a7a']],
    sizes: SIZES,
    price: 649,
    rating: 4.7,
    desc: 'Paçası lastikli jogger eşofman altı. Yanda altın sarısı şerit, belde bağcık, iki yan cep.',
    specs: ['Lastikli paça', 'Bağcıklı bel', 'İki yan cep', 'Yan şerit detayı']
  },
  {
    id: 'esofman-takimi',
    name: 'Eşofman Takımı',
    category: 'Eşofman',
    model: 'tracksuit',
    color: '#2c4a7a',
    color2: '#2c4a7a',
    colors: [['Lacivert', '#2c4a7a'], ['Siyah', '#221c19'], ['Bordo', '#7a2420']],
    print: 'Z47',
    sizes: SIZES,
    price: 1290,
    oldPrice: 1490,
    rating: 4.8,
    tag: 'Takım',
    desc: 'Fermuarlı üst ve jogger alttan oluşan takım. Altın sarısı şerit detaylı, göğüste küçük logo baskısı.',
    specs: ['Üst + alt takım', 'İçi şardonlu', 'Lastikli paça', 'Logo baskı']
  }
]

// Yönetim panelindeki değişiklikler (fiyat, renk, beden, stok, gizleme) site açılırken uygulanır.
// Renk listesinin ilki ürünün varsayılan rengi olur
export function applyEdits(base, edit) {
  if (!edit) return { ...base }
  const p = { ...base, ...edit }
  if (!p.colors?.length) p.colors = base.colors
  p.color = p.colors[0][1]
  if (base.color2) p.color2 = p.color
  if (!p.sizes?.length) p.sizes = base.sizes
  if (!p.oldPrice || p.oldPrice <= p.price) delete p.oldPrice
  if (!p.tag) delete p.tag
  return p
}
const edits = getProductEdits()
// Gizlenenler dahil tüm ürünler (panel için) ve sitede görünenler
export const ALL_PRODUCTS = BASE_PRODUCTS.map((b) => applyEdits(b, edits[b.id]))
export const PRODUCTS = ALL_PRODUCTS.filter((p) => !p.hidden)

// Bedenin stoğu bitti mi? (stok girilmemişse sınırsız sayılır)
export const soldOut = (product, size) => product.stock?.[size] === 0

// Seçilen renkle ürünün kopyası (3D model ve manken bu rengi giyer). Takımda üst ve alt aynı renk olur
export const withColor = (product, color) =>
  !color || color === product.color ? product : { ...product, color, ...(product.color2 && { color2: color }) }

// Eski fiyata göre indirim yüzdesi (ör. 18)
export const discount = (product) => (product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0)

export const formatPrice = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
