// Ürün listesi — ad, fiyat, açıklama ve 3D modeli buradan düzenleyin.
// model: src/three/Models.jsx içindeki modellerden biri
// (tshirt, sweatshirt, hoodie, joggers, tracksuit; 3D baskı modelleri de duruyor ama şu an satılmıyor)
// color = kumaş rengi, color2 = eşofman takımının altı, print = göğüsteki baskı yazısı,
// sizes = beden seçenekleri (varsa sepete eklemeden önce beden seçilir)

export const CATEGORIES = ['Tümü', 'Tişört', 'Eşofman']

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

export const PRODUCTS = [
  {
    id: 'baskili-tisort',
    name: 'Baskılı Tişört',
    category: 'Tişört',
    model: 'tshirt',
    color: '#f1ece2',
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
    sizes: SIZES,
    price: 649,
    rating: 4.7,
    desc: 'Gri melanj, paçası lastikli jogger eşofman altı. Yanda altın sarısı şerit, belde bağcık, iki yan cep.',
    specs: ['Lastikli paça', 'Bağcıklı bel', 'İki yan cep', 'Yan şerit detayı']
  },
  {
    id: 'esofman-takimi',
    name: 'Eşofman Takımı',
    category: 'Eşofman',
    model: 'tracksuit',
    color: '#2c4a7a',
    color2: '#2c4a7a',
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

export const formatPrice = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
