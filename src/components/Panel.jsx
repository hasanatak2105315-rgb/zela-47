import { useEffect, useMemo, useState } from 'react'
import { BASE_PRODUCTS, ALL_SIZES, applyEdits, formatPrice, discount } from '../data/products'
import { SITE } from '../data/site'
import { FREE_SHIPPING, SHIPPING_FEE } from '../store/cart'
import { Logo, DEFAULT_NOTICES } from './Navbar'
import { navigate } from '../router'
import * as admin from '../store/admin'

// Yönetim paneli (/panel). Demo: sunucu olmadığı için veriler yalnızca bu tarayıcıda saklanır.
// Bölümler: Özet, Siparişler, Ürünler, Ayarlar. Şifre ilk girişte oluşturulur.

const TABS = [
  ['overview', 'Özet', 'M4 13h6V4H4zm10 7h6v-9h-6zM4 20h6v-4H4zm10-11h6V4h-6z'],
  ['orders', 'Siparişler', 'M6 7h12l-1 13H7L6 7Zm3 0a3 3 0 0 1 6 0'],
  ['products', 'Ürünler', 'M8 4l-5 3 2 4 2-1v10h10V10l2 1 2-4-5-3c-1 2-2.5 3-4 3S9 6 8 4z'],
  ['settings', 'Ayarlar', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z']
]

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' })
const dayKey = (d) => new Date(d).toLocaleDateString('sv-SE') // YYYY-AA-GG (yerel saat)
const counted = (o) => o.status !== 'cancelled' // iptaller ciroya girmez

/* ---------------- Giriş ---------------- */

// Art arda yanlış girişte kısa bekleme (tarayıcı içinde; gerçek koruma sunucuyla gelecek)
const LOCK = 'zela-admin-lock'
const readLock = () => {
  try {
    return JSON.parse(sessionStorage.getItem(LOCK)) ?? { fails: 0, until: 0 }
  } catch {
    return { fails: 0, until: 0 }
  }
}
const writeLock = (v) => {
  try {
    sessionStorage.setItem(LOCK, JSON.stringify(v))
  } catch {}
}

function Login({ onDone }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const lock = readLock()
    const wait = Math.ceil((lock.until - Date.now()) / 1000)
    if (wait > 0) return setError(`Çok fazla yanlış deneme. ${wait} saniye sonra tekrar dene.`)
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('E-posta adresini yaz.')
    if (!pass) return setError('Şifreni yaz.')
    setBusy(true)
    const ok = await admin.checkLogin(email, pass)
    setBusy(false)
    if (!ok) {
      const fails = lock.fails + 1
      writeLock({ fails: fails >= 5 ? 0 : fails, until: fails >= 5 ? Date.now() + 30000 : 0 })
      return setError(fails >= 5 ? 'Çok fazla yanlış deneme. 30 saniye sonra tekrar dene.' : 'E-posta ya da şifre yanlış.')
    }
    writeLock({ fails: 0, until: 0 })
    admin.setLoggedIn(true)
    onDone()
  }

  return (
    <div className="adm-login">
      <form className="adm-login__card" onSubmit={submit} noValidate>
        <Logo />
        <h1>Yönetim paneli</h1>
        <p className="muted">Devam etmek için panel e-postanı ve şifreni yaz.</p>
        <label className="field">
          <span>E-posta</span>
          <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoFocus />
        </label>
        <label className="field">
          <span>Şifre</span>
          <input type="password" name="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
        </label>
        {error && (
          <p className="adm-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
          {busy ? 'Kontrol ediliyor…' : 'Giriş yap'}
        </button>
        <a className="adm-login__back" href="/" onClick={(e) => (e.preventDefault(), navigate('/'))}>
          ← Siteye dön
        </a>
      </form>
    </div>
  )
}

/* ---------------- Örnek siparişler (panelin dolu hâlini görmek için) ---------------- */

function sampleOrders() {
  const names = ['Ayşe Yılmaz', 'Mehmet Kaya', 'Zeynep Demir', 'Emre Çelik', 'Elif Şahin', 'Burak Aydın', 'Selin Arslan', 'Can Doğan', 'Merve Koç']
  const statuses = ['new', 'new', 'preparing', 'preparing', 'shipped', 'delivered', 'delivered', 'delivered', 'cancelled']
  const now = Date.now()
  return names.map((name, i) => {
    const p = BASE_PRODUCTS[i % BASE_PRODUCTS.length]
    const qty = 1 + (i % 2)
    const subtotal = p.price * qty
    const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE
    return {
      no: `ÖRN-${100231 + i * 37}`,
      sample: true,
      date: new Date(now - i * 26 * 3600 * 1000 - i * 1700 * 1000).toISOString(),
      status: statuses[i],
      email: `ornek${i + 1}@ornek.com`,
      customer: { name, email: `ornek${i + 1}@ornek.com`, phone: `0530 000 00 ${String(10 + i).padStart(2, '0')}`, address: `Örnek Mah. ${i + 3}. Sokak No: ${i + 1}, Tokat` },
      items: [{ id: p.id, name: p.name, size: p.sizes[(i + 1) % p.sizes.length], color: p.colors[i % p.colors.length][0], qty, unit: p.price, custom: i === 1 ? { place: 'Ön', text: 'Ön: “Ece 2026”' } : undefined }],
      subtotal,
      shipping,
      total: subtotal + shipping
    }
  })
}

/* ---------------- Özet ---------------- */

function Stat({ label, value, hint }) {
  return (
    <div className="adm-stat">
      <small>{label}</small>
      <strong>{value}</strong>
      {hint && <span className="muted">{hint}</span>}
    </div>
  )
}

function SalesChart({ orders }) {
  const days = useMemo(() => {
    const list = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setHours(12, 0, 0, 0)
      d.setDate(d.getDate() - i)
      list.push({ key: dayKey(d), label: dayFmt.format(d), total: 0, count: 0 })
    }
    for (const o of orders.filter(counted)) {
      const day = list.find((x) => x.key === dayKey(o.date))
      if (day) {
        day.total += o.total
        day.count++
      }
    }
    return list
  }, [orders])
  const max = Math.max(...days.map((d) => d.total), 1)
  return (
    <div className="adm-card adm-card--chart">
      <div className="adm-card__head">
        <h2>Son 14 günün satışı</h2>
        <span className="muted">{formatPrice(days.reduce((s, d) => s + d.total, 0))}</span>
      </div>
      <div className="adm-chart" role="list" aria-label="Son 14 günün günlük satış tutarları">
        {days.map((d, i) => (
          <div className="adm-chart__col" key={d.key} role="listitem" aria-label={`${d.label}: ${formatPrice(d.total)}, ${d.count} sipariş`} tabIndex={0}>
            <span className="adm-chart__tip">
              <b>{formatPrice(d.total)}</b>
              {d.label} · {d.count} sipariş
            </span>
            <i style={{ height: d.total ? `${Math.max(3, (d.total / max) * 100)}%` : 0 }} />
            <small>{i % 2 === 1 || i === 13 ? d.label : ''}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function Overview({ orders, products, onOpen, onSamples, go }) {
  const valid = orders.filter(counted)
  const today = dayKey(new Date())
  const month = today.slice(0, 7)
  const sum = (list) => list.reduce((s, o) => s + o.total, 0)
  const waiting = orders.filter((o) => o.status === 'new' || o.status === 'preparing').length

  const top = useMemo(() => {
    const map = new Map()
    for (const o of valid)
      for (const it of o.items) {
        const row = map.get(it.id) ?? { name: it.name, qty: 0, total: 0 }
        row.qty += it.qty
        row.total += it.unit * it.qty
        map.set(it.id, row)
      }
    return [...map.values()].sort((a, b) => b.qty - a.qty)
  }, [valid])
  const topMax = Math.max(...top.map((t) => t.qty), 1)

  const lowStock = products.flatMap((p) => p.sizes.filter((s) => typeof p.stock?.[s] === 'number' && p.stock[s] <= 2).map((s) => ({ p, s, n: p.stock[s] })))

  if (!orders.length)
    return (
      <div className="adm-empty">
        <h2>Henüz sipariş yok</h2>
        <p className="muted">Sitede biri ödeme yaptığında sipariş burada görünür. Panelin dolu hâlini görmek istersen örnek siparişler ekleyebilirsin; sonra tek tuşla silersin.</p>
        <button className="btn btn--primary" onClick={onSamples}>
          Örnek siparişler ekle
        </button>
      </div>
    )

  return (
    <div className="adm-grid">
      <div className="adm-stats">
        <Stat label="Bugünkü satış" value={formatPrice(sum(valid.filter((o) => dayKey(o.date) === today)))} hint={`${valid.filter((o) => dayKey(o.date) === today).length} sipariş`} />
        <Stat label="Bu ay" value={formatPrice(sum(valid.filter((o) => dayKey(o.date).startsWith(month))))} />
        <Stat label="Toplam ciro" value={formatPrice(sum(valid))} hint={`${valid.length} sipariş`} />
        <Stat label="Ortalama sepet" value={formatPrice(valid.length ? Math.round(sum(valid) / valid.length) : 0)} />
        <Stat label="Bekleyen" value={waiting} hint="yeni + hazırlanıyor" />
      </div>
      <SalesChart orders={orders} />
      <div className="adm-card">
        <div className="adm-card__head">
          <h2>En çok satanlar</h2>
        </div>
        <ul className="adm-top">
          {top.map((t) => (
            <li key={t.name}>
              <span>{t.name}</span>
              <b>{t.qty} adet</b>
              <span className="muted">{formatPrice(t.total)}</span>
              <i style={{ '--w': `${(t.qty / topMax) * 100}%` }} />
            </li>
          ))}
        </ul>
        {lowStock.length > 0 && (
          <div className="adm-low">
            <h3>Stoğu azalanlar</h3>
            {lowStock.map(({ p, s, n }) => (
              <button key={p.id + s} type="button" onClick={() => go('products')}>
                {p.name} · {s} <b className={n === 0 ? 'adm-pill adm-pill--out' : 'adm-pill adm-pill--preparing'}>{n === 0 ? 'Tükendi' : `${n} kaldı`}</b>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="adm-card adm-card--wide">
        <div className="adm-card__head">
          <h2>Son siparişler</h2>
          <button className="adm-link" onClick={() => go('orders')}>
            Tümünü gör →
          </button>
        </div>
        <OrderRows orders={orders.slice(0, 5)} onOpen={onOpen} />
      </div>
    </div>
  )
}

/* ---------------- Siparişler ---------------- */

const Pill = ({ status }) => <span className={`adm-pill adm-pill--${status}`}>{admin.statusLabel(status)}</span>
const itemCount = (o) => o.items.reduce((s, i) => s + i.qty, 0)

function OrderRows({ orders, onOpen }) {
  return (
    <div className="adm-rows" role="table" aria-label="Siparişler">
      <div className="adm-row adm-row--head" role="row">
        <span role="columnheader">Sipariş</span>
        <span role="columnheader">Müşteri</span>
        <span role="columnheader">Ürünler</span>
        <span role="columnheader">Tutar</span>
        <span role="columnheader">Durum</span>
      </div>
      {orders.map((o) => (
        <button className="adm-row" role="row" key={o.no} onClick={() => onOpen(o.no)}>
          <span role="cell">
            <b>{o.no}</b>
            <small className="muted">{dateFmt.format(new Date(o.date))}</small>
          </span>
          <span role="cell">{o.customer?.name}</span>
          <span role="cell" className="adm-row__items">
            {o.items.some((i) => i.custom) && <em className="adm-tag">Özel baskı</em>}
            {itemCount(o)} ürün
          </span>
          <span role="cell">
            <b>{formatPrice(o.total)}</b>
          </span>
          <span role="cell">
            <Pill status={o.status} />
          </span>
        </button>
      ))}
    </div>
  )
}

function exportCsv(orders) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const head = ['Sipariş no', 'Tarih', 'Durum', 'Müşteri', 'E-posta', 'Telefon', 'Adres', 'Ürünler', 'Ara toplam', 'İndirim kodu', 'İndirim', 'Kargo', 'Toplam', 'Kargo takip', 'Not']
  const rows = orders.map((o) => [
    o.no,
    new Date(o.date).toLocaleString('tr-TR'),
    admin.statusLabel(o.status),
    o.customer?.name,
    o.customer?.email,
    o.customer?.phone,
    o.customer?.address,
    o.items.map((i) => `${i.qty}x ${i.name}${i.size ? ' ' + i.size : ''}${i.color ? ' ' + i.color : ''}${i.custom ? ' (özel baskı: ' + i.custom.text + ')' : ''}`).join(' | '),
    o.subtotal,
    o.coupon,
    o.discount,
    o.shipping,
    o.total,
    o.tracking,
    o.note
  ])
  // Excel'in Türkçe karakterleri doğru açması için BOM ve noktalı virgül
  const csv = '﻿' + [head, ...rows].map((r) => r.map(esc).join(';')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `zela47-siparisler-${dayKey(new Date())}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

function Orders({ orders, onOpen }) {
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const term = q.trim().toLocaleLowerCase('tr-TR')
  const list = orders.filter(
    (o) =>
      (status === 'all' || o.status === status) &&
      (!term || [o.no, o.customer?.name, o.customer?.email, o.customer?.phone].some((v) => v?.toLocaleLowerCase('tr-TR').includes(term)))
  )
  return (
    <div className="adm-card adm-card--wide">
      <div className="adm-toolbar">
        <input className="adm-search" type="search" placeholder="Sipariş no, isim, e-posta ya da telefon ara" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Siparişlerde ara" />
        <button className="adm-ghost" onClick={() => exportCsv(list)} disabled={!list.length}>
          Excel'e aktar (CSV)
        </button>
      </div>
      <div className="adm-chips" role="tablist" aria-label="Durum">
        {[['all', 'Tümü'], ...admin.STATUSES].map(([k, label]) => (
          <button key={k} role="tab" aria-selected={status === k} className={status === k ? 'active' : ''} onClick={() => setStatus(k)}>
            {label} <i>{k === 'all' ? orders.length : orders.filter((o) => o.status === k).length}</i>
          </button>
        ))}
      </div>
      {list.length ? <OrderRows orders={list} onOpen={onOpen} /> : <p className="muted adm-none">{orders.length ? 'Bu filtreye uyan sipariş yok.' : 'Henüz sipariş yok.'}</p>}
    </div>
  )
}

function OrderDrawer({ order, onClose, onChange, onDelete }) {
  const [zoom, setZoom] = useState(null)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && (zoom ? setZoom(null) : onClose())
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, zoom])
  if (!order) return null
  const c = order.customer ?? {}
  const wa = c.phone?.replace(/\D/g, '').replace(/^0/, '90')
  return (
    <>
      <div className="adm-backdrop" onClick={onClose} />
      <aside className="adm-drawer" role="dialog" aria-modal="true" aria-label={`Sipariş ${order.no}`} data-lenis-prevent>
        <div className="adm-drawer__head">
          <div>
            <h2>{order.no}</h2>
            <span className="muted">
              {dateFmt.format(new Date(order.date))}
              {order.sample && ' · örnek sipariş'}
            </span>
          </div>
          <button className="adm-x" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>

        <section>
          <h3>Durum</h3>
          <div className="adm-status" role="radiogroup" aria-label="Sipariş durumu">
            {admin.STATUSES.map(([k, label]) => (
              <button key={k} role="radio" aria-checked={order.status === k} className={order.status === k ? `active adm-status--${k}` : ''} onClick={() => onChange({ status: k })}>
                {label}
              </button>
            ))}
          </div>
          <label className="field">
            <span>Kargo takip numarası</span>
            <input value={order.tracking ?? ''} onChange={(e) => onChange({ tracking: e.target.value })} placeholder="ör. Yurtiçi 1234567890" />
          </label>
        </section>

        <section>
          <h3>Müşteri</h3>
          <dl className="adm-dl">
            <dt>Ad soyad</dt>
            <dd>{c.name}</dd>
            <dt>E-posta</dt>
            <dd>
              <a href={`mailto:${c.email}?subject=${encodeURIComponent(`ZELA 47 · ${order.no}`)}`}>{c.email}</a>
            </dd>
            <dt>Telefon</dt>
            <dd>
              {c.phone ? <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a> : '—'}
              {wa && (
                <a className="adm-wa" href={`https://wa.me/${wa}?text=${encodeURIComponent(`Merhaba ${c.name?.split(' ')[0] ?? ''}, ZELA 47 siparişin (${order.no}) hakkında yazıyoruz.`)}`} target="_blank" rel="noopener">
                  WhatsApp'tan yaz
                </a>
              )}
            </dd>
            <dt>Adres</dt>
            <dd>{c.address}</dd>
          </dl>
        </section>

        <section>
          <h3>Ürünler</h3>
          <ul className="adm-items">
            {order.items.map((it, i) => (
              <li key={i}>
                <div>
                  <b>
                    {it.qty} × {it.name}
                  </b>
                  <span className="muted">{[it.size && `Beden ${it.size}`, it.color].filter(Boolean).join(' · ')}</span>
                  {it.custom && (
                    <span className="adm-custom">
                      <em className="adm-tag">Özel baskı</em> {it.custom.text}
                    </span>
                  )}
                </div>
                <b>{formatPrice(it.unit * it.qty)}</b>
                {it.custom?.previews && (
                  <div className="adm-previews">
                    {Object.entries(it.custom.previews).map(([side, src]) => (
                      <button key={side} onClick={() => setZoom(src)} aria-label={`${side === 'front' ? 'Ön' : 'Arka'} yüz tasarımını büyüt`}>
                        <img src={src} alt="" />
                        <small>{side === 'front' ? 'Ön' : 'Arka'}</small>
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="adm-sum">
            <span>Ara toplam</span>
            <span>{formatPrice(order.subtotal ?? order.total)}</span>
            {order.discount > 0 && (
              <>
                <span>İndirim ({order.coupon})</span>
                <span>−{formatPrice(order.discount)}</span>
              </>
            )}
            <span>Kargo</span>
            <span>{order.shipping ? formatPrice(order.shipping) : 'Ücretsiz'}</span>
            <b>Toplam</b>
            <b>{formatPrice(order.total)}</b>
          </div>
          {order.items.some((i) => i.custom) && (
            <p className="muted adm-note">Baskı dosyasını (yüksek çözünürlüklü PNG) müşteri tasarım stüdyosundan indirip sana gönderir. Gerçek veritabanına geçince dosya siparişle birlikte otomatik gelecek.</p>
          )}
        </section>

        <section>
          <h3>İç not</h3>
          <textarea className="adm-textarea" rows={3} value={order.note ?? ''} onChange={(e) => onChange({ note: e.target.value })} placeholder="Yalnızca sen görürsün (ör. kargoya verildi, müşteri aradı…)" />
        </section>

        <button className="adm-danger" onClick={() => window.confirm(`${order.no} siparişi silinsin mi? Bu geri alınamaz.`) && onDelete()}>
          Siparişi sil
        </button>
      </aside>
      {zoom && (
        <div className="adm-zoom" onClick={() => setZoom(null)} role="dialog" aria-label="Tasarım önizlemesi">
          <img src={zoom} alt="Tasarım önizlemesi" />
        </div>
      )}
    </>
  )
}

/* ---------------- Ürünler ---------------- */

function ProductEditor({ base, edit, visibleCount, onSave, onReset }) {
  const start = () => {
    const p = applyEdits(base, edit)
    return { hidden: !!p.hidden, name: p.name, price: p.price, oldPrice: p.oldPrice ?? '', tag: p.tag ?? '', desc: p.desc, colors: p.colors.map((c) => [...c]), sizes: [...p.sizes], stock: { ...(p.stock ?? {}) } }
  }
  const [f, setF] = useState(start)
  const [msg, setMsg] = useState('')
  const [errors, setErrors] = useState({})
  const set = (k, v) => {
    setF((x) => ({ ...x, [k]: v }))
    setMsg('')
  }
  const off = Number(f.oldPrice) > Number(f.price) ? discount({ price: Number(f.price), oldPrice: Number(f.oldPrice) }) : 0

  const save = () => {
    const e = {}
    if (!f.name.trim()) e.name = 'Ürün adı boş olamaz.'
    if (!(Number(f.price) > 0)) e.price = 'Geçerli bir fiyat yaz.'
    if (f.oldPrice !== '' && Number(f.oldPrice) <= Number(f.price)) e.oldPrice = 'Eski fiyat, satış fiyatından yüksek olmalı (ya da boş bırak).'
    if (!f.colors.length) e.colors = 'En az bir renk olmalı.'
    if (!f.sizes.length) e.sizes = 'En az bir beden seç.'
    if (f.hidden && !edit?.hidden && visibleCount <= 1) e.hidden = 'Sitede en az bir ürün satışta kalmalı.'
    setErrors(e)
    if (Object.keys(e).length) return
    const stock = {}
    for (const s of f.sizes) if (f.stock[s] !== '' && f.stock[s] !== undefined && f.stock[s] !== null) stock[s] = Math.max(0, Math.round(Number(f.stock[s])))
    onSave({
      hidden: f.hidden,
      name: f.name.trim(),
      price: Math.round(Number(f.price)),
      oldPrice: f.oldPrice === '' ? 0 : Math.round(Number(f.oldPrice)),
      tag: f.tag.trim(),
      desc: f.desc.trim(),
      colors: f.colors.map(([n, h]) => [n.trim() || 'Renk', h]),
      sizes: ALL_SIZES.filter((s) => f.sizes.includes(s)),
      stock
    })
    setMsg('Kaydedildi. Siteyi yenileyince değişiklik görünür.')
  }
  const err = (k) => errors[k] && <small className="adm-error">{errors[k]}</small>

  return (
    <div className={`adm-card adm-product ${f.hidden ? 'adm-product--off' : ''}`}>
      <div className="adm-card__head">
        <div className="adm-product__title">
          <span className="adm-swatches">
            {f.colors.map(([n, h]) => (
              <i key={n + h} style={{ background: h }} title={n} />
            ))}
          </span>
          <h2>{f.name || base.name}</h2>
          {off > 0 && <em className="price__off">%{off}</em>}
        </div>
        <label className="adm-switch">
          <input type="checkbox" checked={!f.hidden} onChange={(e) => set('hidden', !e.target.checked)} />
          <span>{f.hidden ? 'Gizli' : 'Satışta'}</span>
        </label>
      </div>
      {err('hidden')}
      <div className="adm-form">
        <label className="field">
          <span>Ürün adı</span>
          <input value={f.name} onChange={(e) => set('name', e.target.value)} />
          {err('name')}
        </label>
        <label className="field">
          <span>Etiket (ör. Çok Satan)</span>
          <input value={f.tag} onChange={(e) => set('tag', e.target.value)} placeholder="Boş bırakılabilir" />
        </label>
        <label className="field">
          <span>Satış fiyatı (₺)</span>
          <input type="number" min="1" inputMode="numeric" value={f.price} onChange={(e) => set('price', e.target.value)} />
          {err('price')}
        </label>
        <label className="field">
          <span>Eski fiyat (₺, indirim için)</span>
          <input type="number" min="0" inputMode="numeric" value={f.oldPrice} onChange={(e) => set('oldPrice', e.target.value)} placeholder="İndirim yoksa boş" />
          {err('oldPrice')}
        </label>
        <label className="field adm-form__full">
          <span>Açıklama</span>
          <textarea className="adm-textarea" rows={2} value={f.desc} onChange={(e) => set('desc', e.target.value)} />
        </label>
      </div>

      <h3>Renkler</h3>
      <p className="muted adm-help">İlk renk ürünün varsayılan rengidir (kartta ve 3D'de ilk o görünür).</p>
      <ul className="adm-colors">
        {f.colors.map(([name, hex], i) => (
          <li key={i}>
            <label className="adm-colorpick" title="Rengi seç">
              <input type="color" value={hex} onChange={(e) => set('colors', f.colors.map((c, j) => (j === i ? [c[0], e.target.value] : c)))} aria-label={`${name} renk kodu`} />
              <i style={{ background: hex }} />
            </label>
            <input value={name} onChange={(e) => set('colors', f.colors.map((c, j) => (j === i ? [e.target.value, c[1]] : c)))} aria-label="Renk adı" />
            {i > 0 && (
              <button className="adm-mini" onClick={() => set('colors', [f.colors[i], ...f.colors.filter((_, j) => j !== i)])} title="Varsayılan yap">
                ↑ İlk yap
              </button>
            )}
            <button className="adm-mini adm-mini--danger" onClick={() => set('colors', f.colors.filter((_, j) => j !== i))} aria-label={`${name} rengini sil`} disabled={f.colors.length === 1}>
              Sil
            </button>
          </li>
        ))}
      </ul>
      {err('colors')}
      {f.colors.length < 8 && (
        <button className="adm-ghost" onClick={() => set('colors', [...f.colors, ['Yeni renk', '#888888']])}>
          + Renk ekle
        </button>
      )}

      <h3>Bedenler ve stok</h3>
      <p className="muted adm-help">Stok boş bırakılırsa sınırsız sayılır. 0 yazılan beden sitede "tükendi" olur, sipariş geldikçe stok kendiliğinden düşer.</p>
      <div className="adm-sizes">
        {ALL_SIZES.map((s) => {
          const on = f.sizes.includes(s)
          return (
            <div key={s} className={`adm-size ${on ? 'on' : ''}`}>
              <label>
                <input type="checkbox" checked={on} onChange={(e) => set('sizes', e.target.checked ? [...f.sizes, s] : f.sizes.filter((x) => x !== s))} />
                <b>{s}</b>
              </label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="∞"
                disabled={!on}
                value={f.stock[s] ?? ''}
                onChange={(e) => set('stock', { ...f.stock, [s]: e.target.value === '' ? '' : Number(e.target.value) })}
                aria-label={`${s} beden stok`}
              />
            </div>
          )
        })}
      </div>
      {err('sizes')}

      <div className="adm-actions">
        <button className="btn btn--primary" onClick={save}>
          Kaydet
        </button>
        {edit && (
          <button
            className="adm-ghost"
            onClick={() => {
              if (!window.confirm(`${base.name} için yaptığın tüm değişiklikler silinsin, ilk hâline dönsün mü?`)) return
              onReset()
              setF(() => {
                const p = base
                return { hidden: false, name: p.name, price: p.price, oldPrice: p.oldPrice ?? '', tag: p.tag ?? '', desc: p.desc, colors: p.colors.map((c) => [...c]), sizes: [...p.sizes], stock: {} }
              })
              setMsg('İlk hâline döndü. Siteyi yenileyince görünür.')
            }}
          >
            İlk hâline dön
          </button>
        )}
        {msg && (
          <span className="adm-ok" role="status">
            {msg}
          </span>
        )}
      </div>
    </div>
  )
}

function Products({ edits, setEdits }) {
  const visibleCount = BASE_PRODUCTS.filter((b) => !edits[b.id]?.hidden).length
  return (
    <div className="adm-stack">
      {BASE_PRODUCTS.map((b) => (
        <ProductEditor
          key={b.id}
          base={b}
          edit={edits[b.id]}
          visibleCount={visibleCount}
          onSave={(e) => setEdits({ ...edits, [b.id]: e })}
          onReset={() => {
            const next = { ...edits }
            delete next[b.id]
            setEdits(next)
          }}
        />
      ))}
    </div>
  )
}

/* ---------------- Ayarlar ---------------- */

const CONTACT = [
  ['email', 'E-posta', 'email'],
  ['phone', 'Telefon', 'tel'],
  ['whatsapp', 'WhatsApp destek hattı', 'tel'],
  ['address', 'Adres', 'text'],
  ['hours', 'Çalışma saatleri', 'text'],
  ['instagram', 'Instagram adresi', 'url']
]

function Settings({ onReset }) {
  const saved = admin.getSettings()
  const [f, setF] = useState(() => ({
    ...Object.fromEntries(CONTACT.map(([k]) => [k, typeof saved[k] === 'string' ? saved[k] : SITE[k] ?? ''])),
    shippingFee: saved.shippingFee ?? SHIPPING_FEE,
    freeShipping: saved.freeShipping ?? FREE_SHIPPING,
    notices: [0, 1, 2].map((i) => (saved.notices ?? DEFAULT_NOTICES)[i] ?? ''),
    coupons: admin.getCoupons().map((c) => ({ ...c }))
  }))
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const set = (k, v) => {
    setF((x) => ({ ...x, [k]: v }))
    setMsg('')
  }

  const save = (e) => {
    e.preventDefault()
    setError('')
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return setError('E-posta adresi geçerli görünmüyor.')
    if (f.instagram && !/^https?:\/\//.test(f.instagram)) return setError('Instagram adresi https:// ile başlamalı (ör. https://instagram.com/zela47).')
    if (!(Number(f.shippingFee) >= 0) || !(Number(f.freeShipping) >= 0)) return setError('Kargo tutarları 0 ya da daha büyük olmalı.')
    const coupons = f.coupons.map((c) => ({ ...c, code: admin.normCode(c.code), percent: Math.round(Number(c.percent)), min: Math.max(0, Math.round(Number(c.min) || 0)) }))
    if (coupons.some((c) => !c.code)) return setError('İndirim kodlarından birinin adı boş.')
    if (coupons.some((c) => !(c.percent >= 1 && c.percent <= 90))) return setError('İndirim yüzdesi 1 ile 90 arasında olmalı.')
    if (new Set(coupons.map((c) => c.code)).size !== coupons.length) return setError('Aynı indirim kodu iki kez yazılmış.')
    admin.setSettings({
      ...Object.fromEntries(CONTACT.map(([k]) => [k, f[k].trim()])),
      shippingFee: Math.round(Number(f.shippingFee)),
      freeShipping: Math.round(Number(f.freeShipping)),
      notices: f.notices.map((t) => t.trim()),
      coupons
    })
    setF((x) => ({ ...x, coupons }))
    setMsg('Kaydedildi. Siteyi yenileyince değişiklikler görünür.')
  }

  // Giriş bilgileri: yeni e-posta ve/veya yeni şifre, şu anki şifre doğrulanarak kaydedilir
  const [pw, setPw] = useState(() => ({ email: admin.currentLogin().email, old: '', next: '', again: '' }))
  const [pwMsg, setPwMsg] = useState('')
  const changePass = async (e) => {
    e.preventDefault()
    const current = admin.currentLogin()
    if (!(await admin.checkLogin(current.email, pw.old))) return setPwMsg('Şu anki şifre yanlış.')
    if (!/^\S+@\S+\.\S+$/.test(pw.email.trim())) return setPwMsg('Giriş e-postası geçerli görünmüyor.')
    if (pw.next && pw.next.length < 8) return setPwMsg('Yeni şifre en az 8 karakter olmalı.')
    if (pw.next !== pw.again) return setPwMsg('Yeni şifreler aynı değil.')
    await admin.setLogin(pw.email, pw.next || pw.old)
    setPw({ email: pw.email.trim().toLowerCase(), old: '', next: '', again: '' })
    setPwMsg('Giriş bilgilerin kaydedildi.')
  }

  return (
    <div className="adm-stack">
      <form className="adm-card" onSubmit={save} noValidate>
        <div className="adm-card__head">
          <h2>İletişim bilgileri</h2>
        </div>
        <p className="muted adm-help">Boş bırakılan bilgi sitede gösterilmez (ör. WhatsApp boşsa WhatsApp butonu gizlenir).</p>
        <div className="adm-form">
          {CONTACT.map(([k, label, type]) => (
            <label className="field" key={k}>
              <span>{label}</span>
              <input type={type} value={f[k]} onChange={(e) => set(k, e.target.value)} />
            </label>
          ))}
        </div>
        <h3>Kargo</h3>
        <div className="adm-form">
          <label className="field">
            <span>Kargo ücreti (₺)</span>
            <input type="number" min="0" inputMode="numeric" value={f.shippingFee} onChange={(e) => set('shippingFee', e.target.value)} />
          </label>
          <label className="field">
            <span>Ücretsiz kargo sınırı (₺)</span>
            <input type="number" min="0" inputMode="numeric" value={f.freeShipping} onChange={(e) => set('freeShipping', e.target.value)} />
          </label>
        </div>
        <h3>İndirim kodları</h3>
        <p className="muted adm-help">Müşteri kodu sepette yazar. "Tek kullanım" işaretliyse aynı e-posta kodu yalnızca bir kez kullanabilir; ilk böyle kod bülten ve üyelik sayfalarında "hoş geldin" kodu olarak gösterilir.</p>
        <ul className="adm-coupons">
          {f.coupons.map((c, i) => {
            const upd = (values) => set('coupons', f.coupons.map((x, j) => (j === i ? { ...x, ...values } : x)))
            return (
              <li key={i}>
                <label className="field">
                  <span>Kod</span>
                  <input value={c.code} onChange={(e) => upd({ code: e.target.value.toUpperCase() })} maxLength={20} />
                </label>
                <label className="field">
                  <span>İndirim %</span>
                  <input type="number" min="1" max="90" inputMode="numeric" value={c.percent} onChange={(e) => upd({ percent: e.target.value })} />
                </label>
                <label className="field">
                  <span>En az sepet (₺)</span>
                  <input type="number" min="0" inputMode="numeric" value={c.min ?? 0} onChange={(e) => upd({ min: e.target.value })} />
                </label>
                <label className="adm-check">
                  <input type="checkbox" checked={!!c.once} onChange={(e) => upd({ once: e.target.checked })} /> Tek kullanım
                </label>
                <label className="adm-check">
                  <input type="checkbox" checked={!!c.active} onChange={(e) => upd({ active: e.target.checked })} /> Aktif
                </label>
                <button type="button" className="adm-mini adm-mini--danger" onClick={() => set('coupons', f.coupons.filter((_, j) => j !== i))}>
                  Sil
                </button>
              </li>
            )
          })}
        </ul>
        {f.coupons.length < 10 && (
          <button type="button" className="adm-ghost" onClick={() => set('coupons', [...f.coupons, { code: '', percent: 10, min: 0, once: false, active: true }])}>
            + Kod ekle
          </button>
        )}
        <h3>Üstteki duyuru bandı</h3>
        <p className="muted adm-help">Sitenin en üstündeki kırmızı bantta sırayla dönen yazılar. Boş satır gösterilmez.</p>
        <div className="adm-form">
          {f.notices.map((t, i) => (
            <label className="field adm-form__full" key={i}>
              <span>{i + 1}. yazı</span>
              <input value={t} maxLength={80} onChange={(e) => set('notices', f.notices.map((x, j) => (j === i ? e.target.value : x)))} />
            </label>
          ))}
        </div>
        {error && (
          <p className="adm-error" role="alert">
            {error}
          </p>
        )}
        <div className="adm-actions">
          <button className="btn btn--primary" type="submit">
            Kaydet
          </button>
          {msg && (
            <span className="adm-ok" role="status">
              {msg}
            </span>
          )}
        </div>
      </form>

      <form className="adm-card" onSubmit={changePass} noValidate>
        <div className="adm-card__head">
          <h2>Giriş bilgileri</h2>
        </div>
        <p className="muted adm-help">Panele bu e-posta ve şifreyle girersin. Değiştirmek için şu anki şifreni yaz; yeni şifre boş kalırsa yalnızca e-posta değişir.</p>
        <div className="adm-form">
          <label className="field adm-form__full">
            <span>Giriş e-postası</span>
            <input type="email" value={pw.email} onChange={(e) => setPw({ ...pw, email: e.target.value })} autoComplete="username" />
          </label>
          <label className="field adm-form__full">
            <span>Şu anki şifre</span>
            <input type="password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} autoComplete="current-password" />
          </label>
          <label className="field">
            <span>Yeni şifre</span>
            <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
          </label>
          <label className="field">
            <span>Yeni şifre (tekrar)</span>
            <input type="password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} autoComplete="new-password" />
          </label>
        </div>
        <div className="adm-actions">
          <button className="adm-ghost" type="submit">
            Kaydet
          </button>
          {pwMsg && <span className={pwMsg === 'Giriş bilgilerin kaydedildi.' ? 'adm-ok' : 'adm-error'}>{pwMsg}</span>}
        </div>
      </form>

      <div className="adm-card adm-card--danger">
        <div className="adm-card__head">
          <h2>Verileri sıfırla</h2>
        </div>
        <p className="muted adm-help">Tüm siparişleri, ürün değişikliklerini ve ayarları siler; site ilk hâline döner. Giriş bilgilerin kalır.</p>
        <button className="adm-danger" onClick={() => window.confirm('Tüm siparişler, ürün değişiklikleri ve ayarlar silinsin mi? Bu geri alınamaz.') && onReset()}>
          Her şeyi sıfırla
        </button>
      </div>
    </div>
  )
}

/* ---------------- Panel ---------------- */

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState(() => TABS.find(([k]) => k === window.location.hash.slice(1))?.[0] ?? 'overview')
  const [orders, setOrdersState] = useState(admin.getOrders)
  const [edits, setEditsState] = useState(admin.getProductEdits)
  const [openNo, setOpenNo] = useState(null)
  const [settingsKey, setSettingsKey] = useState(0)

  const go = (t) => {
    setTab(t)
    window.history.replaceState(null, '', `/panel#${t}`)
    window.scrollTo(0, 0)
  }
  const setOrders = (next) => {
    setOrdersState(next)
    admin.setOrders(next)
  }
  const setEdits = (next) => {
    setEditsState(next)
    admin.setProductEdits(next)
  }
  // Başka sekmede yeni sipariş gelirse (site ve panel aynı anda açıkken) liste güncellenir
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === admin.KEYS.orders) setOrdersState(admin.getOrders())
      if (e.key === admin.KEYS.products) setEditsState(admin.getProductEdits())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const products = BASE_PRODUCTS.map((b) => applyEdits(b, edits[b.id]))
  const open = orders.find((o) => o.no === openNo) ?? null
  const fresh = orders.filter((o) => o.status === 'new').length
  const hasSamples = orders.some((o) => o.sample)
  const title = TABS.find(([k]) => k === tab)[1]

  return (
    <div className="adm">
      <aside className="adm__side">
        <a href="/" className="adm__logo" onClick={(e) => (e.preventDefault(), navigate('/'))} aria-label="Siteye dön">
          <Logo />
          <span>Yönetim</span>
        </a>
        <nav className="adm__nav">
          {TABS.map(([k, label, d]) => (
            <button key={k} className={tab === k ? 'active' : ''} onClick={() => go(k)} aria-current={tab === k ? 'page' : undefined}>
              <Icon d={d} />
              {label}
              {k === 'orders' && fresh > 0 && <b className="adm__badge">{fresh}</b>}
            </button>
          ))}
        </nav>
        <div className="adm__foot">
          <button onClick={() => navigate('/')}>← Siteye dön</button>
          <button
            onClick={() => {
              admin.setLoggedIn(false)
              onLogout()
            }}
          >
            Çıkış yap
          </button>
        </div>
      </aside>

      <main className="adm__main">
        <div className="adm__mobile">
          <a href="/" className="adm__logo-m" onClick={(e) => (e.preventDefault(), navigate('/'))} aria-label="Siteye dön">
            <Logo />
          </a>
          <button
            className="adm-ghost"
            onClick={() => {
              admin.setLoggedIn(false)
              onLogout()
            }}
          >
            Çıkış yap
          </button>
        </div>
        <p className="adm-demo" role="note">
          <b>Deneme sürümü:</b> sunucu henüz olmadığı için siparişler ve değişiklikler yalnızca bu tarayıcıda saklanıyor. Müşterilerin siparişlerinin buraya düşmesi için panel bir veritabanına bağlanacak.
        </p>
        <header className="adm__head">
          <h1>{title}</h1>
          {hasSamples && (
            <button className="adm-ghost" onClick={() => setOrders(orders.filter((o) => !o.sample))}>
              Örnek siparişleri sil
            </button>
          )}
        </header>
        {tab === 'overview' && <Overview orders={orders} products={products} onOpen={setOpenNo} onSamples={() => setOrders([...orders, ...sampleOrders()].sort((a, b) => b.date.localeCompare(a.date)))} go={go} />}
        {tab === 'orders' && <Orders orders={orders} onOpen={setOpenNo} />}
        {tab === 'products' && <Products edits={edits} setEdits={setEdits} />}
        {tab === 'settings' && (
          <Settings
            key={settingsKey}
            onReset={() => {
              setOrders([])
              setEdits({})
              admin.setSettings({})
              setSettingsKey((n) => n + 1)
              window.location.reload()
            }}
          />
        )}
      </main>

      <OrderDrawer
        order={open}
        onClose={() => setOpenNo(null)}
        onChange={(values) => setOrders(orders.map((o) => (o.no === openNo ? { ...o, ...values } : o)))}
        onDelete={() => {
          setOrders(orders.filter((o) => o.no !== openNo))
          setOpenNo(null)
        }}
      />
    </div>
  )
}

export default function Panel() {
  const [authed, setAuthed] = useState(admin.isLoggedIn)
  return authed ? <Dashboard onLogout={() => setAuthed(false)} /> : <Login onDone={() => setAuthed(true)} />
}
