// Yönetim paneli verileri (demo: sunucu olmadığı için yalnızca bu tarayıcının localStorage'ında).
// Siparişler ödeme anında buraya yazılır; ürün ve ayar değişiklikleri site açılırken uygulanır.
// Bu dosya hiçbir site dosyasını içe aktarmaz (products.js ve site.js bunu kullanır, döngü olmasın)

export const KEYS = {
  orders: 'zela-orders',
  products: 'zela-admin-products',
  settings: 'zela-admin-settings',
  pass: 'zela-admin-pass'
}

export function readStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}
export function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/* ---------- Siparişler ---------- */

export const STATUSES = [
  ['new', 'Yeni'],
  ['preparing', 'Hazırlanıyor'],
  ['shipped', 'Kargoda'],
  ['delivered', 'Teslim edildi'],
  ['cancelled', 'İptal']
]
export const statusLabel = (key) => STATUSES.find(([k]) => k === key)?.[1] ?? key

export const getOrders = () => readStore(KEYS.orders, [])

// Yeni sipariş en başa eklenir; stok takibi yapılan bedenlerden düşülür.
// Kota aşılırsa (büyük tasarım önizlemeleri) önizlemesiz kaydedilir
export function saveOrder(order) {
  const orders = [order, ...getOrders()]
  if (!writeStore(KEYS.orders, orders)) {
    const lite = { ...order, items: order.items.map((i) => (i.custom ? { ...i, custom: { ...i.custom, previews: undefined } } : i)) }
    writeStore(KEYS.orders, [lite, ...getOrders()])
  }
  const edits = getProductEdits()
  let changed = false
  for (const item of order.items) {
    const stock = edits[item.id]?.stock
    if (stock && item.size && typeof stock[item.size] === 'number') {
      stock[item.size] = Math.max(0, stock[item.size] - item.qty)
      changed = true
    }
  }
  if (changed) writeStore(KEYS.products, edits)
}
export const setOrders = (orders) => writeStore(KEYS.orders, orders)

/* ---------- Ürün değişiklikleri ---------- */

// { [ürünId]: { hidden, price, oldPrice, tag, desc, colors, sizes, stock: { S: 3 } } }
export const getProductEdits = () => readStore(KEYS.products, {})
export const setProductEdits = (edits) => writeStore(KEYS.products, edits)

/* ---------- Site ayarları ---------- */

// { email, phone, whatsapp, address, hours, instagram, shippingFee, freeShipping, notices: [] }
export const getSettings = () => readStore(KEYS.settings, {})
export const setSettings = (s) => writeStore(KEYS.settings, s)

/* ---------- Panel şifresi ---------- */

// Şifre düz yazı değil, SHA-256 özeti olarak saklanır. Demo düzeyinde bir korumadır:
// gerçek güvenlik için şifre sunucuda kontrol edilmelidir
export async function hashPass(text) {
  const data = new TextEncoder().encode('zela47:' + text)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
export const hasPass = () => !!readStore(KEYS.pass, null)
export async function setPass(text) {
  writeStore(KEYS.pass, await hashPass(text))
}
export async function checkPass(text) {
  return readStore(KEYS.pass, null) === (await hashPass(text))
}
const SESSION = 'zela-admin-session'
export const isLoggedIn = () => {
  try {
    return sessionStorage.getItem(SESSION) === '1'
  } catch {
    return false
  }
}
export const setLoggedIn = (on) => {
  try {
    on ? sessionStorage.setItem(SESSION, '1') : sessionStorage.removeItem(SESSION)
  } catch {}
}
