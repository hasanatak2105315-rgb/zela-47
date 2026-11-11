import { useEffect, useState } from 'react'
import { Page, Reveal } from './Pages'
import { Link, navigate } from '../router'
import { formatPrice } from '../data/products'
import { whatsappLink } from '../data/site'
import { getOrders, statusLabel } from '../store/admin'
import { useUser, register, login, logout, updateProfile, changePassword, deleteAccount } from '../store/auth'

// Üyelik sayfaları: Giriş (/giris), Kayıt (/kayit), Hesabım (/hesabim).
// Demo: üyelik bilgileri yalnızca bu tarayıcıda saklanır (bkz. store/auth.js)

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^(90)?0?5\d{9}$/
const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

const DemoNote = () => (
  <p className="auth__demo" role="note">
    <b>Deneme sürümü:</b> üyelik bilgilerin şimdilik yalnızca bu tarayıcıda saklanır; başka bir cihazdan aynı hesapla giriş yapılamaz.
  </p>
)

// Hata gösteren form alanı
function Field({ label, error, children }) {
  return (
    <label className={`field ${error ? 'field--error' : ''}`}>
      <span>{label}</span>
      {children}
      {error && <small role="alert">{error}</small>}
    </label>
  )
}

/* ---------------- Giriş ---------------- */

export function Login() {
  const user = useUser()
  const [f, setF] = useState({ email: '', pass: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (user) navigate('/hesabim')
  }, [user])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!EMAIL.test(f.email.trim())) return setError('Geçerli bir e-posta adresi yaz.')
    if (!f.pass) return setError('Şifreni yaz.')
    setBusy(true)
    const res = await login(f.email, f.pass)
    setBusy(false)
    if (res.error) setError(res.error)
  }

  return (
    <Page eyebrow="Üyelik" title={<>Giriş <em>yap</em></>} intro="Siparişlerini görmek ve bilgilerini kaydetmek için hesabına gir.">
      <Reveal className="auth">
        <form className="checkout auth__card" onSubmit={submit} noValidate>
          <Field label="E-posta">
            <input type="email" name="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="username" />
          </Field>
          <Field label="Şifre">
            <input type="password" name="password" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} autoComplete="current-password" />
          </Field>
          {error && (
            <p className="auth__error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? 'Kontrol ediliyor…' : 'Giriş Yap'}
          </button>
          <p className="auth__alt">
            Hesabın yok mu? <Link to="/kayit">Kayıt ol</Link>
          </p>
          <p className="auth__alt muted">
            Şifreni mi unuttun?{' '}
            {whatsappLink() ? (
              <a href={whatsappLink('Merhaba, hesabımın şifresini unuttum.')} target="_blank" rel="noopener">
                Destek hattımıza yaz
              </a>
            ) : (
              <Link to="/iletisim">Bize yaz</Link>
            )}
            .
          </p>
          <DemoNote />
        </form>
      </Reveal>
    </Page>
  )
}

/* ---------------- Kayıt ---------------- */

export function Register() {
  const user = useUser()
  const [f, setF] = useState({ name: '', email: '', phone: '', pass: '', again: '', terms: false, marketing: false })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (user) navigate('/hesabim')
  }, [user])
  const set = (k) => (e) => {
    setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const found = {}
    if (f.name.trim().length < 3 || !f.name.trim().includes(' ')) found.name = 'Adını ve soyadını yaz.'
    if (!EMAIL.test(f.email.trim())) found.email = 'Geçerli bir e-posta adresi yaz.'
    if (f.phone.trim() && !PHONE.test(f.phone.replace(/\D/g, ''))) found.phone = 'Telefonunu 05xx xxx xx xx şeklinde yaz.'
    if (f.pass.length < 8) found.pass = 'Şifre en az 8 karakter olmalı.'
    else if (!/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(f.pass) || !/\d/.test(f.pass)) found.pass = 'Şifrede en az bir harf ve bir rakam olmalı.'
    if (f.again !== f.pass) found.again = 'İki şifre aynı değil.'
    if (!f.terms) found.terms = 'Üye olmak için koşulları kabul etmelisin.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    const res = await register(f)
    setBusy(false)
    if (res.error) setErrors({ email: res.error })
  }

  return (
    <Page eyebrow="Üyelik" title={<>Kayıt <em>ol</em></>} intro="Bir dakikada hesap aç: siparişlerini takip et, bilgilerin ödeme sayfasında hazır gelsin.">
      <Reveal className="auth">
        <form className="checkout auth__card" onSubmit={submit} noValidate>
          <Field label="Ad soyad" error={errors.name}>
            <input name="name" value={f.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} />
          </Field>
          <Field label="E-posta" error={errors.email}>
            <input type="email" name="email" value={f.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} />
          </Field>
          <Field label="Telefon (isteğe bağlı)" error={errors.phone}>
            <input type="tel" name="phone" value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="05xx xxx xx xx" aria-invalid={!!errors.phone} />
          </Field>
          <div className="row">
            <Field label="Şifre" error={errors.pass}>
              <input type="password" name="new-password" value={f.pass} onChange={set('pass')} autoComplete="new-password" aria-invalid={!!errors.pass} />
            </Field>
            <Field label="Şifre (tekrar)" error={errors.again}>
              <input type="password" name="new-password-again" value={f.again} onChange={set('again')} autoComplete="new-password" aria-invalid={!!errors.again} />
            </Field>
          </div>

          {/* KVKK: aydınlatma metni bilgilendirmedir, rıza değildir; ticari ileti rızası ayrı ve isteğe bağlıdır */}
          <p className="auth__kvkk">
            Kişisel verilerin, üyeliğinin oluşturulması ve siparişlerinin yürütülmesi amacıyla <Link to="/kvkk">KVKK Aydınlatma Metni</Link>’nde açıklandığı
            şekilde işlenir.
          </p>
          <label className={`check ${errors.terms ? 'field--error' : ''}`}>
            <input type="checkbox" name="terms" checked={f.terms} onChange={set('terms')} />
            <span>
              <a href="/kullanim-kosullari" target="_blank" rel="noopener">Kullanım Koşulları</a>’nı okudum ve kabul ediyorum.
            </span>
          </label>
          {errors.terms && (
            <small className="auth__error" role="alert">
              {errors.terms}
            </small>
          )}
          <label className="check">
            <input type="checkbox" name="marketing" checked={f.marketing} onChange={set('marketing')} />
            <span>
              <a href="/kvkk#acik-riza" target="_blank" rel="noopener">Açık Rıza Metni</a>’ni okudum; kampanya ve yeni ürün duyurularının e-posta ve SMS yoluyla tarafıma
              gönderilmesine açık rıza veriyorum. (İsteğe bağlı; dilediğin zaman hesabından geri alabilirsin.)
            </span>
          </label>

          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? 'Hesap açılıyor…' : 'Kayıt Ol'}
          </button>
          <p className="auth__alt">
            Zaten hesabın var mı? <Link to="/giris">Giriş yap</Link>
          </p>
          <DemoNote />
        </form>
      </Reveal>
    </Page>
  )
}

/* ---------------- Hesabım ---------------- */

function Profile({ user }) {
  const [f, setF] = useState({ name: user.name, phone: user.phone ?? '', address: user.address ?? '' })
  const [errors, setErrors] = useState({})
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => {
    setF((x) => ({ ...x, [k]: e.target.value }))
    setMsg('')
  }
  const save = (e) => {
    e.preventDefault()
    const found = {}
    if (f.name.trim().length < 3) found.name = 'Adını ve soyadını yaz.'
    if (f.phone.trim() && !PHONE.test(f.phone.replace(/\D/g, ''))) found.phone = 'Telefonunu 05xx xxx xx xx şeklinde yaz.'
    setErrors(found)
    if (Object.keys(found).length) return
    updateProfile({ name: f.name.trim(), phone: f.phone.trim(), address: f.address.trim() })
    setMsg('Bilgilerin kaydedildi.')
  }
  return (
    <form className="checkout account__card" onSubmit={save} noValidate>
      <h2>Bilgilerim</h2>
      <Field label="Ad soyad" error={errors.name}>
        <input value={f.name} onChange={set('name')} autoComplete="name" />
      </Field>
      <Field label="E-posta">
        <input value={user.email} disabled readOnly />
      </Field>
      <Field label="Telefon" error={errors.phone}>
        <input type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="05xx xxx xx xx" />
      </Field>
      <Field label="Teslimat adresi">
        <textarea rows={3} value={f.address} onChange={set('address')} autoComplete="street-address" placeholder="Ödeme sayfasında hazır gelir" />
      </Field>
      <div className="account__actions">
        <button className="btn btn--primary" type="submit">
          Kaydet
        </button>
        {msg && (
          <span className="account__ok" role="status">
            {msg}
          </span>
        )}
      </div>
    </form>
  )
}

function Password() {
  const [f, setF] = useState({ old: '', next: '', again: '' })
  const [msg, setMsg] = useState(null)
  const submit = async (e) => {
    e.preventDefault()
    if (f.next.length < 8 || !/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(f.next) || !/\d/.test(f.next)) return setMsg({ error: 'Yeni şifre en az 8 karakter olmalı, harf ve rakam içermeli.' })
    if (f.next !== f.again) return setMsg({ error: 'Yeni şifreler aynı değil.' })
    const res = await changePassword(f.old, f.next)
    if (res.error) return setMsg(res)
    setF({ old: '', next: '', again: '' })
    setMsg({ ok: 'Şifren değişti.' })
  }
  const input = (k, label, auto) => (
    <Field label={label}>
      <input type="password" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} autoComplete={auto} />
    </Field>
  )
  return (
    <form className="checkout account__card" onSubmit={submit} noValidate>
      <h2>Şifre değiştir</h2>
      {input('old', 'Şu anki şifre', 'current-password')}
      <div className="row">
        {input('next', 'Yeni şifre', 'new-password')}
        {input('again', 'Yeni şifre (tekrar)', 'new-password')}
      </div>
      <div className="account__actions">
        <button className="btn btn--ghost" type="submit">
          Şifreyi Değiştir
        </button>
        {msg && <span className={msg.error ? 'auth__error' : 'account__ok'} role="status">{msg.error ?? msg.ok}</span>}
      </div>
    </form>
  )
}

function Privacy({ user }) {
  const [pass, setPass] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const remove = async (e) => {
    e.preventDefault()
    const res = await deleteAccount(pass)
    if (res.error) return setError(res.error)
    navigate('/')
  }
  return (
    <div className="checkout account__card">
      <h2>İzinler ve kişisel veriler</h2>
      <label className="check">
        <input type="checkbox" checked={!!user.marketing} onChange={(e) => updateProfile({ marketing: e.target.checked })} />
        <span>Kampanya ve yeni ürün duyurularının e-posta ve SMS yoluyla tarafıma gönderilmesine açık rıza veriyorum.</span>
      </label>
      <p className="muted account__small">
        Verilerinin nasıl işlendiği <Link to="/kvkk">KVKK Aydınlatma Metni</Link>’nde yazılıdır. Hesabını sildiğinde üyelik bilgilerin silinir; yasal olarak saklanması gereken
        sipariş ve fatura kayıtları saklama süresi sonunda silinir.
      </p>
      {open ? (
        <form className="account__delete" onSubmit={remove}>
          <Field label="Hesabı silmek için şifreni yaz" error={error}>
            <input type="password" value={pass} onChange={(e) => (setPass(e.target.value), setError(''))} autoComplete="current-password" />
          </Field>
          <div className="account__actions">
            <button className="account__danger" type="submit">
              Hesabımı kalıcı olarak sil
            </button>
            <button className="btn btn--ghost" type="button" onClick={() => setOpen(false)}>
              Vazgeç
            </button>
          </div>
        </form>
      ) : (
        <button className="account__danger" type="button" onClick={() => setOpen(true)}>
          Hesabımı sil
        </button>
      )}
    </div>
  )
}

function Orders({ user }) {
  const [orders] = useState(() => getOrders().filter((o) => !o.sample && (o.userId === user.id || o.customer?.email?.toLowerCase() === user.email)))
  return (
    <div className="account__card account__orders">
      <h2>Siparişlerim</h2>
      {orders.length ? (
        <ul>
          {orders.map((o) => (
            <li key={o.no}>
              <div>
                <b>{o.no}</b>
                <span className="muted">{dateFmt.format(new Date(o.date))}</span>
              </div>
              <span className={`adm-pill adm-pill--${o.status}`}>{statusLabel(o.status)}</span>
              <p>
                {o.items.map((i) => `${i.qty} × ${i.name}${i.size ? ` (${i.size})` : ''}`).join(', ')}
              </p>
              <b>{formatPrice(o.total)}</b>
              {o.tracking && (
                <p className="muted account__small">
                  Kargo takip: <b>{o.tracking}</b>
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="muted">Henüz bir siparişin yok.</p>
          <Link className="btn btn--ghost" to="/">
            Koleksiyona Göz At
          </Link>
        </>
      )}
    </div>
  )
}

export function Account() {
  const user = useUser()
  useEffect(() => {
    if (!user) navigate('/giris')
  }, [user])
  if (!user) return null
  return (
    <Page eyebrow="Hesabım" title={<>Merhaba, <em>{user.name.split(' ')[0]}</em></>} intro={`${dateFmt.format(new Date(user.createdAt))} tarihinden beri üyesin.`}>
      <div className="account">
        <div className="account__col">
          <Orders user={user} />
          <Privacy user={user} />
        </div>
        <div className="account__col">
          <Profile user={user} />
          <Password />
          <button className="btn btn--ghost account__logout" onClick={() => (logout(), navigate('/'))}>
            Çıkış Yap
          </button>
          <DemoNote />
        </div>
      </div>
    </Page>
  )
}
