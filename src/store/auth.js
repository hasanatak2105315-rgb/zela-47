import { useSyncExternalStore } from 'react'
import { readStore, writeStore } from './admin'

// Müşteri üyeliği: kayıt, giriş ve hesap bilgileri.
// Demo: sunucu olmadığı için üyeler yalnızca bu tarayıcının localStorage'ında saklanır
// (başka cihazdan aynı hesapla girilemez). Şifre düz yazı olarak saklanmaz: her üyenin kendi
// rastgele tuzu ile PBKDF2 (SHA-256, 210.000 tur) özeti tutulur. Gerçek üyelik için sunucu gerekir.

const USERS = 'zela-users'
const SESSION = 'zela-user'

const normEmail = (e) => e.trim().toLowerCase()
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

async function hashPass(pass, salt) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits'])
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 210000 }, key, 256))
}
const newSalt = () => hex(crypto.getRandomValues(new Uint8Array(16)))

const getUsers = () => readStore(USERS, [])
const setUsers = (users) => writeStore(USERS, users)

// Şifre özeti ve tuz dışarı verilmez
const publicUser = (u) => {
  if (!u) return null
  const { hash, salt, ...rest } = u
  return rest
}

/* ---------- Oturum (tüm sekmelerde ortak) ---------- */

const subs = new Set()
let cache = { key: null, user: null }
const emit = () => {
  cache.key = null
  subs.forEach((f) => f())
}
function snapshot() {
  const id = readStore(SESSION, null)
  const raw = id ? getUsers().find((u) => u.id === id) : null
  const key = raw ? JSON.stringify(raw) : ''
  if (cache.key !== key) cache = { key, user: publicUser(raw) }
  return cache.user
}
function subscribe(fn) {
  subs.add(fn)
  const onStorage = (e) => (e.key === USERS || e.key === SESSION) && emit()
  window.addEventListener('storage', onStorage)
  return () => {
    subs.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}
export const useUser = () => useSyncExternalStore(subscribe, snapshot)
export const currentUser = snapshot

/* ---------- İşlemler (hata varsa { error }, yoksa { user }) ---------- */

export async function register({ name, email, phone, pass, marketing }) {
  const users = getUsers()
  if (users.some((u) => u.email === normEmail(email))) return { error: 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.' }
  const salt = newSalt()
  const now = new Date().toISOString()
  const user = {
    id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name.trim(),
    email: normEmail(email),
    phone: phone.trim(),
    address: '',
    salt,
    hash: await hashPass(pass, salt),
    createdAt: now,
    // KVKK: aydınlatma metninin okunduğu ve (verildiyse) ticari ileti rızasının zamanı kayıt altında tutulur
    informedAt: now,
    marketing: !!marketing,
    marketingAt: marketing ? now : null
  }
  if (!setUsers([...users, user])) return { error: 'Kayıt tarayıcıya yazılamadı. Tarayıcının site verilerine izin verdiğinden emin ol.' }
  writeStore(SESSION, user.id)
  emit()
  return { user: publicUser(user) }
}

export async function login(email, pass) {
  const user = getUsers().find((u) => u.email === normEmail(email))
  // hesap olmasa da aynı süre hesap yapılır, aynı mesaj verilir (hangi e-postanın kayıtlı olduğu anlaşılmasın)
  const hash = await hashPass(pass, user?.salt ?? 'yok')
  if (!user || hash !== user.hash) return { error: 'E-posta ya da şifre yanlış.' }
  writeStore(SESSION, user.id)
  emit()
  return { user: publicUser(user) }
}

export function logout() {
  try {
    localStorage.removeItem(SESSION)
  } catch {}
  emit()
}

export function updateProfile(values) {
  const id = readStore(SESSION, null)
  const now = new Date().toISOString()
  setUsers(
    getUsers().map((u) => {
      if (u.id !== id) return u
      const next = { ...u, ...values }
      if ('marketing' in values && values.marketing !== u.marketing) next.marketingAt = values.marketing ? now : null
      return next
    })
  )
  emit()
}

export async function changePassword(oldPass, newPass) {
  const id = readStore(SESSION, null)
  const user = getUsers().find((u) => u.id === id)
  if (!user || (await hashPass(oldPass, user.salt)) !== user.hash) return { error: 'Şu anki şifre yanlış.' }
  const salt = newSalt()
  const hash = await hashPass(newPass, salt)
  setUsers(getUsers().map((u) => (u.id === id ? { ...u, salt, hash } : u)))
  emit()
  return {}
}

// KVKK md. 11: silme hakkı. Hesap ve üyelik bilgileri silinir (yasal saklama süresi olan sipariş kayıtları kalır)
export async function deleteAccount(pass) {
  const id = readStore(SESSION, null)
  const user = getUsers().find((u) => u.id === id)
  if (!user || (await hashPass(pass, user.salt)) !== user.hash) return { error: 'Şifre yanlış.' }
  setUsers(getUsers().filter((u) => u.id !== id))
  logout()
  return {}
}
