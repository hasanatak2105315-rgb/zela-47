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

/* ---------- Panel girişi (e-posta + şifre) ---------- */

// Şifre kodda düz yazı olarak durmaz: e-posta ve şifreden PBKDF2 (SHA-256, 210.000 tur) ile
// üretilen özet saklanır. Site kodu herkese açık olduğu için demo düzeyinde bir korumadır;
// gerçek güvenlik için giriş sunucuda (ör. Supabase) kontrol edilmelidir.
// Panelden değiştirilirse yeni e-posta ve özet bu tarayıcıda saklanır (KEYS.pass)
export const DEFAULT_LOGIN = {
  email: 'hasanatak.2105315@gmail.com',
  hash: 'e7003343f7e6a25e789d20ddb98f262c6308588de4203cf922d305bc915b4f9c'
}
const normEmail = (e) => e.trim().toLowerCase()

export async function hashLogin(email, pass) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(normEmail(email) + '\n' + pass), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode('zela47-panel-v2'), iterations: 210000 }, key, 256)
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
// Geçerli giriş bilgisi: panelden değiştirildiyse o, yoksa varsayılan
// (eski sürümün yalnızca şifreli kaydı yok sayılır)
export const currentLogin = () => {
  const saved = readStore(KEYS.pass, null)
  return saved?.email && saved?.hash ? saved : DEFAULT_LOGIN
}
export async function checkLogin(email, pass) {
  const login = currentLogin()
  if (normEmail(email) !== normEmail(login.email)) return false
  return (await hashLogin(email, pass)) === login.hash
}
export async function setLogin(email, pass) {
  writeStore(KEYS.pass, { email: normEmail(email), hash: await hashLogin(email, pass) })
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
