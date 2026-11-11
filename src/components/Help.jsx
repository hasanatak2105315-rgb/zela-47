import { useState } from 'react'
import { Page, Reveal } from './Pages'
import { Link } from '../router'
import { formatPrice } from '../data/products'
import { SITE, whatsappLink } from '../data/site'
import { FREE_SHIPPING, SHIPPING_FEE } from '../store/cart'
import { getOrders, statusLabel } from '../store/admin'
import { SIZE_TABLES } from '../store/body'

// Yardım sayfaları: Sipariş Takibi (/siparis-takibi), Beden Rehberi (/beden-rehberi), Kargo ve Teslimat (/kargo)
// (LVS Brands ve FI-MA incelenerek eklendi, 11.11.2026)

const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/* ---------------- Sipariş takibi ---------------- */

const STEPS = [
  ['new', 'Sipariş alındı', 'Siparişin bize ulaştı.'],
  ['preparing', 'Hazırlanıyor', 'Ürünün atölyede hazırlanıyor.'],
  ['shipped', 'Kargoda', 'Paketin kargo firmasına teslim edildi.'],
  ['delivered', 'Teslim edildi', 'Paketin sana ulaştı. İyi günlerde kullan.']
]

function Result({ order }) {
  const at = STEPS.findIndex(([k]) => k === order.status)
  const cancelled = order.status === 'cancelled'
  const help = whatsappLink(`Merhaba, ${order.no} numaralı siparişim için iade / değişim talebim var.`)
  return (
    <div className="track__result" role="status">
      <div className="track__head">
        <div>
          <small>Sipariş numarası</small>
          <strong>{order.no}</strong>
        </div>
        <div>
          <small>Tarih</small>
          <strong>{dateFmt.format(new Date(order.date))}</strong>
        </div>
        <div>
          <small>Toplam</small>
          <strong>{formatPrice(order.total)}</strong>
        </div>
      </div>

      {cancelled ? (
        <p className="track__cancel">Bu sipariş iptal edildi. Bir yanlışlık olduğunu düşünüyorsan bize yaz.</p>
      ) : (
        <ol className="track__steps">
          {STEPS.map(([k, title, text], i) => (
            <li key={k} className={i < at ? 'done' : i === at ? 'done now' : ''} aria-current={i === at ? 'step' : undefined}>
              <i aria-hidden="true">{i <= at ? '✓' : i + 1}</i>
              <strong>{title}</strong>
              <span className="muted">{text}</span>
            </li>
          ))}
        </ol>
      )}

      {order.tracking && (
        <p className="track__no">
          Kargo takip numaran: <b>{order.tracking}</b>
        </p>
      )}

      <ul className="track__items">
        {order.items.map((it, i) => (
          <li key={i}>
            <span>
              {it.qty} × {it.name}
              <small className="muted">{[it.size && `Beden ${it.size}`, it.color, it.custom && 'Kişiye özel baskı'].filter(Boolean).join(' · ')}</small>
            </span>
            <b>{formatPrice(it.unit * it.qty)}</b>
          </li>
        ))}
      </ul>

      <div className="hero__cta">
        {help && !cancelled && (
          <a className="btn btn--ghost" href={help} target="_blank" rel="noopener">
            İade / Değişim Talebi
          </a>
        )}
        <Link className="btn btn--ghost" to="/iade">
          İade Koşulları
        </Link>
      </div>
    </div>
  )
}

export function Track() {
  const q = new URLSearchParams(window.location.search)
  const [f, setF] = useState({ no: q.get('no') ?? '', email: q.get('eposta') ?? '' })
  const [state, setState] = useState(null) // null | 'none' | sipariş
  const find = (e) => {
    e?.preventDefault()
    const no = f.no.trim().toUpperCase().replace(/İ/g, 'I')
    const email = f.email.trim().toLowerCase()
    const order = getOrders().find((o) => !o.sample && o.no.toUpperCase() === no && o.customer?.email?.toLowerCase() === email)
    setState(order ?? 'none')
  }
  return (
    <Page eyebrow="Yardım" title={<>Sipariş <em>takibi</em></>} intro="Sipariş numaranı ve sipariş verirken yazdığın e-postayı gir, siparişinin nerede olduğunu gör.">
      <div className="track">
        <Reveal>
          <form className="checkout track__form" onSubmit={find} noValidate>
            <label className="field">
              <span>Sipariş numarası</span>
              <input value={f.no} onChange={(e) => setF({ ...f, no: e.target.value })} placeholder="ZL-123456" autoComplete="off" />
            </label>
            <label className="field">
              <span>E-posta</span>
              <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
            </label>
            <button className="btn btn--primary btn--block" type="submit" disabled={!f.no.trim() || !f.email.trim()}>
              Siparişimi Bul
            </button>
            <p className="note">Sipariş numaran, sipariş sonrası gösterilen sayfada ve üyeysen Hesabım sayfasında yazar.</p>
            <p className="auth__demo" role="note">
              <b>Deneme sürümü:</b> siparişler şimdilik yalnızca verildiği tarayıcıda saklandığı için, takip de o tarayıcıda çalışır.
            </p>
          </form>
        </Reveal>
        <div aria-live="polite">
          {state === 'none' && (
            <div className="track__result">
              <p className="track__cancel">Bu bilgilerle bir sipariş bulamadık. Sipariş numaranı ve e-postanı kontrol et.</p>
              {whatsappLink() && (
                <a className="btn btn--ghost" href={whatsappLink(`Merhaba, ${f.no} numaralı siparişimi bulamadım.`)} target="_blank" rel="noopener">
                  Destek Hattına Yaz
                </a>
              )}
            </div>
          )}
          {state && state !== 'none' && <Result order={state} />}
        </div>
      </div>
    </Page>
  )
}

/* ---------------- Beden rehberi ---------------- */

// Tablodaki üst sınırlardan "86–93" gibi aralık üretir
const ranges = (rows) => rows.map(([size, max], i) => [size, i === 0 ? `${max} ve altı` : max === Infinity ? `${rows[i - 1][1] + 1} ve üzeri` : `${rows[i - 1][1] + 1}–${max}`])

function SizeTable({ title, note, rows }) {
  return (
    <div className="prose__table">
      <table>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Beden</th>
            <th>{note}</th>
          </tr>
        </thead>
        <tbody>
          {ranges(rows).map(([size, range]) => (
            <tr key={size}>
              <th scope="row">{size}</th>
              <td>{range} cm</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SizeGuide() {
  const [gender, setGender] = useState('female')
  const t = SIZE_TABLES[gender]
  return (
    <Page eyebrow="Yardım" title={<>Beden <em>rehberi</em></>} intro="Doğru bedeni bulmak iki dakikanı alır: ölçünü al, tabloda karşılığına bak.">
      <div className="prose">
        <h2>Nasıl ölçülür?</h2>
        <ul>
          <li><strong>Göğüs:</strong> Mezurayı koltuk altlarından, göğsünün en geniş yerinden yere paralel geçir.</li>
          <li><strong>Kalça:</strong> Ayakların bitişikken kalçanın en geniş yerinden ölç.</li>
          <li>Mezurayı sıkmadan, üzerinde ince bir kıyafet varken ölç. İki beden arasında kalırsan bol kesim için büyük olanı seç.</li>
        </ul>

        <h2>Beden tablosu</h2>
        <div className="sizeguide__tabs" role="tablist" aria-label="Kalıp">
          {[['female', 'Kadın'], ['male', 'Erkek']].map(([k, label]) => (
            <button key={k} role="tab" aria-selected={gender === k} className={gender === k ? 'active' : ''} onClick={() => setGender(k)}>
              {label}
            </button>
          ))}
        </div>
        <div className="sizeguide">
          <SizeTable title="Tişört ve eşofman takımı üstü" note="Göğüs çevresi" rows={t.tops} />
          <SizeTable title="Eşofman altı" note="Kalça çevresi" rows={t.bottoms} />
        </div>
        <p className="muted">Ürünlerimiz unisex, rahat kesimdir. Ölçüler vücut ölçüsüdür; kıyafetin kendi ölçüsü birkaç santim daha geniştir.</p>

        <h2>Emin olamadın mı?</h2>
        <p>
          Sevdiğin bir tişörtünün koltuk altından koltuk altına genişliğini ölçüp bize yaz, doğru bedeni birlikte bulalım. Beden uymazsa 30 gün içinde ücretsiz
          değiştiriyoruz (kişiye özel baskılı ürünler hariç).
        </p>
        <div className="hero__cta">
          {whatsappLink() && (
            <a className="btn btn--primary" href={whatsappLink('Merhaba, beden seçimi için yardım almak istiyorum.')} target="_blank" rel="noopener">
              WhatsApp’tan Sor
            </a>
          )}
          <Link className="btn btn--ghost" to="/iade">
            Değişim Koşulları
          </Link>
        </div>
      </div>
    </Page>
  )
}

/* ---------------- Kargo ve teslimat ---------------- */

export function Shipping() {
  return (
    <Page eyebrow="Yardım" title={<>Kargo ve <em>teslimat</em></>} intro="Siparişin ne zaman yola çıkar, ne kadar tutar, nasıl takip edilir: hepsi burada.">
      <div className="prose">
        <h2>Ne zaman kargoya verilir?</h2>
        <ul>
          <li><strong>Stoktaki ürünler:</strong> 1–3 iş günü içinde kargoya verilir.</li>
          <li><strong>Kişiye özel baskılı ürünler:</strong> tasarım onayından sonra 5–7 iş günü içinde hazırlanıp kargoya verilir.</li>
          <li>Kargoya verildikten sonra teslimat, bulunduğun ile göre genellikle 1–3 iş günü sürer. Teslimat her durumda yasal süre olan 30 günü geçmez.</li>
        </ul>

        <h2>Kargo ücreti</h2>
        <p>
          <strong>{formatPrice(FREE_SHIPPING)}</strong> ve üzeri siparişlerde kargo ücretsizdir. Altındaki siparişlerde kargo ücreti{' '}
          <strong>{formatPrice(SHIPPING_FEE)}</strong>’dir. Şu an yalnızca Türkiye içine gönderim yapıyoruz.
        </p>

        <h2>Siparişimi nasıl takip ederim?</h2>
        <p>
          Siparişin kargoya verildiğinde takip numaran <Link to="/siparis-takibi">Sipariş Takibi</Link> sayfasında ve üyeysen <Link to="/hesabim">Hesabım</Link>{' '}
          sayfasında görünür.
        </p>

        <h2>Paketleme</h2>
        <p>Tüm siparişler ücretsiz olarak hediye kutusunda gönderilir. İstersen siparişine not yazarak kutuya el yazısı bir kart ekletebilirsin.</p>

        <h2>Teslimatta dikkat et</h2>
        <ul>
          <li>Paketi teslim alırken kontrol et; ezik, yırtık ya da açılmış paketi kargo görevlisine tutanak tutturarak teslim alma.</li>
          <li>Adreste bulunamazsan kargo firması genellikle ikinci kez dener, sonra paketi şubede bekletir.</li>
          <li>Ürün hasarlı ya da hatalı ulaştıysa 3 gün içinde fotoğrafıyla birlikte bize yaz; ücretsiz yeniliyoruz.</li>
        </ul>

        <div className="hero__cta">
          <Link className="btn btn--primary" to="/siparis-takibi">
            Sipariş Takibi
          </Link>
          <Link className="btn btn--ghost" to="/iade">
            İade ve Değişim
          </Link>
        </div>
        {SITE.whatsapp && <p className="muted">Sorun mu var? {SITE.whatsapp} numaralı WhatsApp destek hattımıza yazabilirsin.</p>}
      </div>
    </Page>
  )
}
