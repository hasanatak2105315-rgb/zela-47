import { useState } from 'react'
import { motion } from 'motion/react'
import { SITE, owner, whatsappLink } from '../data/site'
import { WhatsAppIcon } from './Extras'
import { FREE_SHIPPING, SHIPPING_FEE } from '../store/cart'
import { formatPrice } from '../data/products'
import { Link } from '../router'

const ease = [0.22, 1, 0.36, 1]

export const Reveal = ({ children, delay = 0, className }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ delay, duration: 0.5, ease }}
  >
    {children}
  </motion.div>
)

// Bize ulaşma yolu: e-posta adresi tanımlıysa o, değilse iletişim sayfası (cümle "…iletebilirsin / yazabilirsin" ile devam eder)
const Reach = () =>
  SITE.email ? (
    <>
      <a href={`mailto:${SITE.email}`}>{SITE.email}</a> adresine
    </>
  ) : (
    <>
      <Link to="/iletisim">İletişim sayfamız</Link> üzerinden
    </>
  )

// Tüm alt sayfaların ortak başlığı
export function Page({ eyebrow, title, intro, children }) {
  return (
    <section className="page">
      <div className="container">
        <motion.header className="page__head" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }}>
          <p className="eyebrow">
            <span className="dot" /> {eyebrow}
          </p>
          <h1 className="display">{title}</h1>
          {intro && <p className="page__intro muted">{intro}</p>}
        </motion.header>
        {children}
      </div>
    </section>
  )
}

/* ---------------- Hakkımızda ---------------- */

const VALUES = [
  ['Kendi Tasarımımız', 'Baskılarımızı kendimiz çiziyor, her birini kumaşa basmadan önce renk ve konum provası yapıyoruz. Yıkandıkça solmayan baskı kullanıyoruz.'],
  ['Seçilmiş Kumaş', 'Tişörtlerimizde %100 pamuk penye, eşofmanlarımızda içi şardonlu kumaş kullanıyor, her parçayı dikimden sonra elle kontrol ediyoruz.'],
  ['Sana Özel', 'İsim, tarih, logo ya da kendi çizimin. Aklındaki fikri birlikte tasarlayıp gerçeğe dönüştürüyoruz.']
]

const STEPS = [
  ['Tasarım', 'Fikir eskizden dijital modele dönüşür.'],
  ['Üretim', 'Baskı kumaşa aktarılır, dikiş ve renk kontrol edilir.'],
  ['Son Dokunuş', 'Ütü, katlama ve kalite kontrolü elle yapılır.'],
  ['Paketleme', 'Her sipariş hediye kutusunda yola çıkar.']
]

export function About() {
  return (
    <Page
      eyebrow="Hakkımızda"
      title={<>Küçük bir atölye, <em>büyük bir özen</em></>}
      intro="ZELA 47, kendi tasarımı baskılı tişört ve eşofmanlar üreten Tokat merkezli bir atölye. Adımızı Jül Sezar'ın M.Ö. 47'de Zela'da, bugünkü Zile'de söylediği “Veni, vidi, vici” (Geldim, gördüm, yendim) sözünden aldık. Seri üretim yerine, her parçaya ayrı ayrı zaman ayırmayı seçiyoruz."
    >
      <div className="values">
        {VALUES.map(([t, d], i) => (
          <Reveal key={t} className="feature" delay={i * 0.05}>
            <span className="values__no">0{i + 1}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </Reveal>
        ))}
      </div>

      <Reveal className="page__block">
        <h2 className="display page__h2">Bir parça nasıl doğar?</h2>
        <ol className="steps">
          {STEPS.map(([t, d]) => (
            <li key={t}>
              <strong>{t}</strong>
              <span className="muted">{d}</span>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal className="page__cta">
        <p className="muted">Aklında sana özel bir tasarım mı var?</p>
        <div className="hero__cta">
          <Link className="btn btn--primary" to="/iletisim">Bize Yaz</Link>
          <Link className="btn btn--ghost" to="/">Koleksiyona Dön</Link>
        </div>
      </Reveal>
    </Page>
  )
}

/* ---------------- İletişim ---------------- */

const TOPICS = ['Sipariş ve kargo', 'Kişiye özel baskı', 'Beden ve değişim', 'İade', 'Diğer']

function validate(f) {
  const e = {}
  if (f.name.trim().length < 2) e.name = 'Lütfen adını yaz.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Geçerli bir e-posta adresi yaz.'
  // Telefon isteğe bağlı; yazıldıysa 05xx xxx xx xx biçiminde olmalı
  if (f.phone.trim() && !/^(90)?0?5\d{9}$/.test(f.phone.replace(/\D/g, ''))) e.phone = 'Telefonunu 05xx xxx xx xx şeklinde yaz.'
  if (f.message.trim().length < 10) e.message = 'Mesajın en az 10 karakter olmalı.'
  return e
}

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', topic: TOPICS[0], message: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }))
  }

  const submit = (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return
    // Sunucu olmadığı için mesaj hazır hâlde ziyaretçinin kendi uygulamasında açılır:
    // e-posta adresi tanımlıysa e-posta uygulamasında, değilse WhatsApp'ta
    const body = `${form.message}\n\n${form.name} — ${form.email}${form.phone.trim() ? ` — ${form.phone.trim()}` : ''}`
    if (SITE.email) window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(`${form.topic} — ${form.name}`)}&body=${encodeURIComponent(body)}`
    else window.open(whatsappLink(`Konu: ${form.topic}\n\n${body}`), '_blank', 'noopener')
    setSent(true)
  }

  const field = (k, label, input) => (
    <label className={`field ${errors[k] ? 'field--error' : ''}`}>
      <span>{label}</span>
      {input}
      {errors[k] && <small role="alert">{errors[k]}</small>}
    </label>
  )

  return (
    <Page
      eyebrow="İletişim"
      title={<>Bize <em>ulaş</em></>}
      intro="Siparişin, kişiye özel bir baskı fikrin ya da aklına takılan bir soru mu var? Yaz, en geç bir iş günü içinde dönelim."
    >
      <div className="contact">
        <Reveal className="contact__info">
          {SITE.email && (
            <div>
              <small>E-posta</small>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </div>
          )}
          {whatsappLink() && (
            <div>
              <small>WhatsApp destek hattı</small>
              <a className="wa-inline" href={whatsappLink('Merhaba, destek almak istiyorum.')} target="_blank" rel="noopener">
                <WhatsAppIcon /> {SITE.whatsapp}
              </a>
            </div>
          )}
          {SITE.phone && (
            <div>
              <small>Telefon</small>
              <a href={`tel:${SITE.phone.replace(/\s/g, '')}`}>{SITE.phone}</a>
            </div>
          )}
          <div>
            <small>Atölye</small>
            <span>{SITE.address}</span>
          </div>
          <div>
            <small>Çalışma saatleri</small>
            <span>{SITE.hours}</span>
          </div>
          {SITE.instagram && (
            <div>
              <small>Sosyal medya</small>
              <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </div>
          )}
          <p className="muted">
            Sık sorulan sorulara <Link to="/sss">SSS sayfamızdan</Link> hemen ulaşabilirsin.
          </p>
        </Reveal>

        <Reveal className="contact__form" delay={0.05}>
          {sent ? (
            <div className="contact__done">
              <div className="done-mark">✓</div>
              <h2 className="display">Mesajın hazır</h2>
              {SITE.email ? (
                <p className="muted">
                  E-posta uygulaman mesajınla birlikte açıldı, göndermeyi unutma. Açılmadıysa doğrudan <a href={`mailto:${SITE.email}`}>{SITE.email}</a> adresine
                  yazabilirsin.
                </p>
              ) : (
                <p className="muted">
                  WhatsApp mesajınla birlikte açıldı, göndermeyi unutma. Açılmadıysa{' '}
                  <a href={whatsappLink('Merhaba, destek almak istiyorum.')} target="_blank" rel="noopener">
                    {SITE.whatsapp}
                  </a>{' '}
                  numaralı destek hattımıza yazabilirsin.
                </p>
              )}
              <button className="btn btn--ghost" onClick={() => setSent(false)}>
                Yeni mesaj
              </button>
            </div>
          ) : (
            <form className="checkout" onSubmit={submit} noValidate>
              {field('name', 'Ad soyad', <input value={form.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} />)}
              {field('email', 'E-posta', <input type="email" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} />)}
              {field(
                'phone',
                'Telefon (isteğe bağlı)',
                <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="05xx xxx xx xx" aria-invalid={!!errors.phone} />
              )}
              {field(
                'topic',
                'Konu',
                <select value={form.topic} onChange={set('topic')}>
                  {TOPICS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              )}
              {field('message', 'Mesajın', <textarea rows={6} value={form.message} onChange={set('message')} aria-invalid={!!errors.message} />)}
              <p className="note">
                Yazdığın bilgiler, talebinin yanıtlanması amacıyla <Link to="/kvkk">KVKK Aydınlatma Metni</Link>’nde açıklandığı şekilde işlenir.
              </p>
              <button className="btn btn--primary btn--block" type="submit">
                Mesajı Gönder
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </Page>
  )
}

/* ---------------- SSS ---------------- */

const FAQ = [
  {
    group: 'Sipariş ve kargo',
    items: [
      ['Siparişim ne zaman kargoya verilir?', 'Stoktaki ürünler 1–3 iş günü içinde kargoya verilir. Kişiye özel siparişler tasarım onayından sonra 5–7 iş günü içinde hazırlanır. Kargoya verildiğinde takip numarası e-postana gelir.'],
      ['Kargo ücreti ne kadar?', `${formatPrice(FREE_SHIPPING)} ve üzeri siparişlerde kargo ücretsizdir. Altındaki siparişler için kargo ücreti ${formatPrice(SHIPPING_FEE)}’dir.`],
      ['Hediye paketi yapıyor musunuz?', 'Evet. Tüm siparişler ücretsiz olarak hediye kutusunda gönderilir. İstersen siparişe not yazarak kutuya el yazısı bir kart ekleyebiliriz.']
    ]
  },
  {
    group: 'Ürünler',
    items: [
      ['Kıyafetleriniz hangi kumaştan?', 'Tişörtlerimiz %100 pamuk penye, eşofmanlarımız içi şardonlu pamuk-polyester karışımıdır. Her ürünün kumaşı, ürün detayındaki özellikler bölümünde yazar.'],
      ['Baskılar yıkamada solar mı?', 'Hayır. Baskılarımız yıkamaya dayanıklıdır. Ürünü ters çevirip 30°C’de yıkar, baskının üstünü ütülemezsen ilk günkü gibi kalır. Kurutma makinesi kullanmamanı öneririz.'],
      ['Hangi bedeni seçmeliyim?', 'Kalıplarımız standarttır. Sevdiğin bir tişörtünün koltuk altından koltuk altına genişliğini ölçüp bize yazarsan doğru bedeni birlikte bulalım.']
    ]
  },
  {
    group: 'Kişiye özel',
    items: [
      ['Kişiye özel baskı nasıl yaptırırım?', 'Her ürünün altındaki “Kişiye özel baskı” butonuna bas, bedenini ve baskı yerini seç, basılacak yazıyı ya da tasarım fikrini yaz. Üretime başlamadan önce sana bir önizleme gönderip onayını alıyoruz.'],
      ['Kendi tasarımımı bastırabilir miyim?', 'Evet. Çizimini, logonu, fotoğrafını ya da 3D modelini (STL) WhatsApp ile gönderebilirsin. Basılabilirliğini kontrol edip süre bilgisi veriyoruz.']
    ]
  },
  {
    group: 'Ödeme ve iade',
    items: [
      ['Ödeme güvenli mi?', 'Ödemeler 256-bit SSL ile şifrelenir ve kart bilgilerin bizim sistemimizde saklanmaz.'],
      ['İade edebilir miyim?', 'Evet, ürünü teslim aldığın günden itibaren 30 gün içinde iade edebilirsin. Kişiye özel baskılı ürünler iade edilemez.']
    ]
  }
]

export function Faq() {
  return (
    <Page
      eyebrow="Yardım"
      title={<>Sıkça sorulan <em>sorular</em></>}
      intro="Aradığın cevabı bulamazsan bize yazman yeterli."
    >
      <div className="faq">
        {FAQ.map((g) => (
          <Reveal key={g.group} className="faq__group">
            <h2>{g.group}</h2>
            {g.items.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p className="muted">{a}</p>
              </details>
            ))}
          </Reveal>
        ))}
      </div>
      <Reveal className="page__cta">
        <p className="muted">İade koşullarının tamamı için:</p>
        <div className="hero__cta">
          <Link className="btn btn--ghost" to="/iade">İade ve Değişim</Link>
          <Link className="btn btn--primary" to="/iletisim">Bize Yaz</Link>
        </div>
      </Reveal>
    </Page>
  )
}

/* ---------------- İade ve değişim ---------------- */

export function Returns() {
  return (
    <Page
      eyebrow="Yardım"
      title={<>İade ve <em>değişim</em></>}
      intro="Aldığın üründen memnun kalmazsan, teslim aldığın günden itibaren 30 gün içinde iade edebilirsin."
    >
      <div className="prose">
        <h2>İade süresi</h2>
        <p>
          Ürünü teslim aldığın tarihten itibaren <strong>30 gün</strong> içinde, herhangi bir gerekçe göstermeden iade edebilirsin. Bu süre, yasal 14 günlük cayma
          hakkından daha uzundur.
        </p>

        <h2>İade nasıl yapılır?</h2>
        <ol>
          <li>
            <Link to="/iletisim">İletişim sayfasından</Link>
            {SITE.email && (
              <>
                {' '}
                ya da <a href={`mailto:${SITE.email}`}>{SITE.email}</a> adresinden
              </>
            )}{' '}
            sipariş numaranla birlikte bize yaz.
          </li>
          <li>Sana anlaşmalı kargo firmasının iade kodunu gönderelim.</li>
          <li>Ürünü orijinal kutusu ve faturasıyla birlikte paketleyip kargoya ver.</li>
          <li>Ürün bize ulaşıp kontrol edildikten sonra ücretin en geç 14 gün içinde ödeme yaptığın karta iade edilir.</li>
        </ol>

        <h2>İade edilemeyen ürünler</h2>
        <ul>
          <li>İsim, tarih, logo ya da sana özel tasarımla üretilen kişiye özel ürünler</li>
          <li>Kullanılmış, zarar görmüş ya da orijinal kutusu olmayan ürünler</li>
        </ul>

        <h2>Değişim</h2>
        <p>
          Beden ya da renk değişimi için aynı adımları izleyebilirsin. Değişim talebinde yeni ürünün kargo ücreti bizden. Kişiye özel ürünlerde değişim
          yapılamaz.
        </p>

        <h2>Hasarlı ya da hatalı ürün</h2>
        <p>
          Ürün sana hasarlı ya da hatalı ulaştıysa, teslimattan sonraki 3 gün içinde fotoğrafıyla birlikte bize yaz. Kişiye özel ürünler dahil, hatalı tüm ürünleri
          ücretsiz olarak yeniliyor ya da ücretini iade ediyoruz.
        </p>
      </div>
    </Page>
  )
}

/* ---------------- KVKK ---------------- */

// Aydınlatma metni, güncel mevzuata göre (11.11.2026):
// - 6698 sayılı Kanun md. 10 ve Aydınlatma Yükümlülüğü Tebliği: veri sorumlusu, amaç, aktarım, toplama yöntemi ve hukuki sebep, haklar
// - 7499 sayılı Kanun (01.06.2024): yurt dışına aktarımda yeterlilik kararı / uygun güvence (md. 9)
// - Kurul'un 18.02.2026 tarih ve 2026/347 sayılı ilke kararı (RG 24.03.2026): aydınlatma metni onay/rıza istemez,
//   açık rıza metni ayrı başlık altında ve ayrı beyanla alınır; metin sade, makul uzunlukta ve faaliyete özgü olur
// Genel taslaktır; yayından önce bir hukukçuya kontrol ettirilmeli.

// Hangi veri, hangi amaçla, hangi hukuki sebeple (Kanun md. 5)
const KVKK_ROWS = [
  ['Üyelik (kayıt ve giriş)', 'Ad, soyad, e-posta, telefon (isteğe bağlı), teslimat adresi, üyelik tarihi; şifren yalnızca geri çözülemeyen özet olarak', 'Üyeliğinin oluşturulması, hesabına giriş yapabilmen ve bilgilerinin ödeme sayfasında hazır gelmesi', 'Sözleşmenin kurulması ve ifası (md. 5/2-c)'],
  ['Sipariş ve teslimat', 'Ad, soyad, e-posta, telefon, teslimat adresi, sipariş içeriği, beden, tutar, kargo takip bilgisi', 'Siparişinin alınması, hazırlanması, teslim edilmesi; iade ve değişim işlemleri', 'Sözleşmenin kurulması ve ifası (md. 5/2-c)'],
  ['Fatura ve yasal kayıtlar', 'Ad, soyad, adres, sipariş ve fatura bilgileri', 'Fatura düzenlenmesi, ticari defter ve belgelerin saklanması, tüketici mevzuatından doğan yükümlülükler', 'Kanunlarda açıkça öngörülmesi (md. 5/2-a) ve hukuki yükümlülük (md. 5/2-ç)'],
  ['Kişiye özel baskı ve tasarım stüdyosu', 'Tasarımına yazdığın yazı, yüklediğin fotoğraf ve görseller', 'İstediğin tasarımın hazırlanması ve ürüne basılması', 'Sözleşmenin kurulması ve ifası (md. 5/2-c)'],
  ['İletişim ve destek', 'Ad, e-posta, telefon, mesajının içeriği', 'Soru, talep ve şikâyetlerinin yanıtlanması', 'Meşru menfaat (md. 5/2-f); siparişle ilgiliyse sözleşmenin ifası (md. 5/2-c)'],
  ['Site güvenliği ve zorunlu kayıtlar', 'Sepetin, favorilerin, tasarım taslağın, oturum bilgin ve çerez tercihin (tarayıcında saklanır); işlem kayıtları', 'Sitenin çalışması, güvenliğinin sağlanması, hukuka aykırı işlemlerin önlenmesi', 'Meşru menfaat (md. 5/2-f) ve hukuki yükümlülük (md. 5/2-ç)'],
  ['Kampanya ve duyurular', 'E-posta adresi, telefon numarası', 'Kampanya, indirim ve yeni ürün duyurularının gönderilmesi', 'Açık rızan (md. 5/1) ve 6563 sayılı Kanun kapsamındaki onayın. Bu rıza aşağıdaki ayrı metinle alınır']
]

export function Kvkk() {
  return (
    <Page
      eyebrow="Yasal"
      title={<>KVKK <em>aydınlatma metni</em></>}
      intro="Kişisel verilerini kimin, hangi amaçla ve hangi hukuki sebeple işlediğini, kimlere aktardığını ve haklarını burada açıklıyoruz."
    >
      <div className="prose">
        <p className="prose__meta">
          Son güncelleme: 11 Kasım 2026. Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu’nun (“Kanun”) 10. maddesi ve Aydınlatma Yükümlülüğünün Yerine
          Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca hazırlanmış bir <strong>bilgilendirmedir</strong>; senden bu metin için onay ya da rıza
          istenmez.
        </p>

        <h2>1. Veri sorumlusu</h2>
        <p>
          Kişisel verilerin, veri sorumlusu sıfatıyla <strong>{owner()}</strong> ({SITE.address}) tarafından işlenir. Bize <Link to="/iletisim">İletişim sayfamızdan</Link>
          {SITE.whatsapp && <> ya da {SITE.whatsapp} numaralı WhatsApp destek hattımızdan</>}
          {SITE.email && (
            <>
              {' '}
              ya da <a href={`mailto:${SITE.email}`}>{SITE.email}</a> adresinden
            </>
          )}{' '}
          ulaşabilirsin.
        </p>

        <h2>2. Hangi verileri, hangi amaçla ve hangi hukuki sebeple işliyoruz?</h2>
        <div className="prose__table" role="region" aria-label="İşlenen veriler tablosu" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th>Faaliyet</th>
                <th>İşlenen veriler</th>
                <th>Amaç</th>
                <th>Hukuki sebep</th>
              </tr>
            </thead>
            <tbody>
              {KVKK_ROWS.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (i === 0 ? <th key={i} scope="row">{cell}</th> : <td key={i}>{cell}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul>
          <li>
            <strong>Kart bilgilerin tarafımızca saklanmaz.</strong> Ödeme, lisanslı ödeme kuruluşu üzerinden alınır.
          </li>
          <li>
            Senden sağlık, din, biyometrik veri gibi <strong>özel nitelikli kişisel veri</strong> istemiyoruz; lütfen formlara ve tasarımlarına bu tür bilgiler yazma.
          </li>
          <li>Tasarımına başka birinin fotoğrafını ya da adını ekliyorsan, o kişinin bundan haberdar olduğundan ve izin verdiğinden emin ol.</li>
          {SITE.analyticsId && <li>Analiz çerezleri yalnızca çerez bandında izin verirsen, açık rızana dayanarak çalışır.</li>}
        </ul>

        <h2>3. Verilerini nasıl topluyoruz?</h2>
        <p>
          Kişisel verilerin; internet sitemizdeki kayıt, giriş, sipariş, iletişim ve bülten formları, tasarım stüdyosu, zorunlu tarayıcı kayıtları (çerez ve benzeri)
          ile bize WhatsApp üzerinden yazdığında, tamamen veya kısmen otomatik yollarla, elektronik ortamda toplanır.
        </p>

        <h2>4. Verilerini kimlere, hangi amaçla aktarıyoruz?</h2>
        <p>Kişisel verilerin Kanun’un 8. maddesine uygun olarak, yalnızca işin gerektirdiği kadarıyla şu alıcılara aktarılır:</p>
        <ul>
          <li><strong>Kargo firması:</strong> siparişinin teslim edilmesi için ad, soyad, telefon ve adresin</li>
          <li><strong>Ödeme kuruluşu ve bankalar:</strong> ödemenin alınması ve iadesi için</li>
          <li><strong>Mali müşavir ve e-fatura hizmet sağlayıcısı:</strong> fatura ve yasal kayıt yükümlülükleri için</li>
          <li><strong>Barındırma ve bilişim hizmeti sağlayıcıları:</strong> sitenin işletilmesi ve verilerin güvenle saklanması için</li>
          <li><strong>Yetkili kamu kurum ve kuruluşları:</strong> kanunen zorunlu olduğunda ve talep edildiği ölçüde</li>
        </ul>
        <p>Verilerini satmıyor, reklam amacıyla üçüncü kişilerle paylaşmıyoruz.</p>

        <h2>5. Yurt dışına aktarım</h2>
        <p>
          Kişisel verilerini şu an yurt dışına aktarmıyoruz. İleride yurt dışında bulunan bir hizmet sağlayıcıdan (örneğin barındırma hizmeti) yararlanırsak
          aktarım, Kanun’un 9. maddesi uyarınca yalnızca hakkında yeterlilik kararı bulunan ülkelere ya da Kişisel Verileri Koruma Kurulu’nun ilan ettiği standart
          sözleşme gibi uygun güvencelerden biri sağlanarak yapılır ve bu metin güncellenir.
        </p>

        <h2>6. Verilerini ne kadar süre saklıyoruz?</h2>
        <ul>
          <li><strong>Üyelik bilgileri:</strong> üyeliğin sürdüğü müddetçe; hesabını sildiğinde silinir.</li>
          <li><strong>Sipariş, fatura ve ticari kayıtlar:</strong> Türk Ticaret Kanunu ve vergi mevzuatı gereği 10 yıl.</li>
          <li><strong>Mesafeli satışa ilişkin bilgi ve belgeler:</strong> tüketici mevzuatı gereği 3 yıl.</li>
          <li><strong>İletişim mesajları:</strong> talebinin sonuçlanmasından itibaren en fazla 2 yıl.</li>
          <li><strong>Kampanya rızası kayıtları:</strong> rızanı geri aldığın tarihten itibaren 3 yıl.</li>
        </ul>
        <p>Süresi dolan veriler Kanun’un 7. maddesi uyarınca silinir, yok edilir ya da anonim hâle getirilir.</p>

        <h2>7. Verilerini nasıl koruyoruz?</h2>
        <p>
          Kanun’un 12. maddesi uyarınca gerekli teknik ve idari tedbirleri alıyoruz: site bağlantısı şifrelidir (SSL), şifren geri çözülemeyen özet olarak saklanır,
          verilerine yalnızca işi gereği yetkili kişiler erişir. Verilerini etkileyen bir ihlal olursa Kurul’a ve sana en kısa sürede bildirimde bulunuruz.
        </p>

        <h2>8. Hakların</h2>
        <p>Kanun’un 11. maddesi uyarınca bize başvurarak;</p>
        <ul>
          <li>verilerinin işlenip işlenmediğini öğrenebilir, işlenmişse bilgi isteyebilir,</li>
          <li>işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenebilir,</li>
          <li>yurt içinde ya da yurt dışında aktarıldığı üçüncü kişileri öğrenebilir,</li>
          <li>eksik ya da yanlış işlenmişse düzeltilmesini; şartları oluşmuşsa silinmesini ya da yok edilmesini ve bu işlemlerin aktarılan kişilere bildirilmesini isteyebilir,</li>
          <li>yalnızca otomatik sistemlerle yapılan analiz sonucunda aleyhine bir sonuç çıkmasına itiraz edebilir,</li>
          <li>Kanun’a aykırı işleme nedeniyle zarara uğradıysan zararının giderilmesini isteyebilirsin.</li>
        </ul>

        <h2>9. Başvuru yolu</h2>
        <p>
          Taleplerini, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ’e uygun olarak; adını, soyadını, iletişim bilgini ve talebini içerecek şekilde{' '}
          <strong>yazılı olarak</strong> yukarıdaki adresimize ya da <Reach /> iletebilirsin. Kimliğini doğrulamak için ek bilgi isteyebiliriz. Başvurun en geç{' '}
          <strong>30 gün</strong> içinde ücretsiz olarak sonuçlandırılır; işlem ayrıca bir maliyet gerektirirse Kurul’un belirlediği tarifedeki ücret alınabilir.
        </p>
        <p>
          Üyeysen bilgilerini düzeltme, kampanya rızanı geri alma ve hesabını silme işlemlerini <Link to="/hesabim">Hesabım</Link> sayfasından kendin de yapabilirsin.
        </p>
        <p>
          Başvurun reddedilir, cevabı yetersiz bulursan ya da süresinde cevap verilmezse; cevabı öğrendiğin tarihten itibaren 30 gün ve her hâlde başvuru tarihinden
          itibaren 60 gün içinde Kişisel Verileri Koruma Kurulu’na şikâyette bulunabilirsin.
        </p>

        <h2 id="cerez">10. Çerezler</h2>
        <p>
          Sitemiz, sepetinin ve oturumunun hatırlanması gibi zorunlu işlevler için tarayıcında küçük veriler saklar.
          {SITE.analyticsId ? ' Analiz çerezleri yalnızca onay verirsen kullanılır.' : ' Reklam ya da takip çerezi kullanılmaz.'} Ayrıntılar{' '}
          <Link to="/gizlilik">Gizlilik ve Çerez Politikası</Link>’ndadır.
        </p>

        <h2>11. Değişiklikler</h2>
        <p>Faaliyetlerimiz ya da mevzuat değiştiğinde bu metni güncelleriz. Güncel metin her zaman bu sayfada yer alır.</p>
      </div>

      {/* İlke kararı gereği açık rıza metni, aydınlatma metninden ayrı başlık altında ve ayrı beyanla sunulur */}
      <div className="prose prose--consent" id="acik-riza">
        <h2>Ticari elektronik ileti açık rıza metni</h2>
        <p>
          Bu metin yukarıdaki aydınlatma metninden <strong>ayrıdır</strong>. Rıza vermek zorunlu değildir; üyelik ve alışveriş için şart koşulmaz.
        </p>
        <p>
          Kayıt ya da bülten formundaki ilgili kutuyu işaretlersen; e-posta adresinin ve (verdiysen) telefon numaranın, <strong>{owner()}</strong> tarafından kampanya,
          indirim ve yeni ürün duyurularının e-posta ve SMS yoluyla gönderilmesi amacıyla işlenmesine, 6698 sayılı Kanun’un 5/1. maddesi ve 6563 sayılı Elektronik
          Ticaretin Düzenlenmesi Hakkında Kanun kapsamında açık rıza vermiş olursun.
        </p>
        <p>
          Rızanı dilediğin zaman, hiçbir gerekçe göstermeden <Link to="/hesabim">Hesabım</Link> sayfasındaki izinler bölümünden ya da{' '}
          <Link to="/iletisim">İletişim sayfamızdan</Link> ücretsiz olarak geri alabilirsin. Geri alma, ileriye dönük olarak sonuç doğurur.
        </p>
      </div>
    </Page>
  )
}

/* ---------------- Satıcı bilgileri (sözleşmelerde ortak) ---------------- */

function SellerInfo() {
  return (
    <ul>
      <li><strong>Unvan:</strong> {owner()}</li>
      <li><strong>Adres:</strong> {SITE.address}</li>
      {SITE.phone && <li><strong>Telefon:</strong> {SITE.phone}</li>}
      {SITE.email && <li><strong>E-posta:</strong> <a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>}
      {SITE.whatsapp && <li><strong>WhatsApp destek hattı:</strong> {SITE.whatsapp}</li>}
      {SITE.taxInfo && <li><strong>Vergi dairesi / no:</strong> {SITE.taxInfo}</li>}
    </ul>
  )
}

/* ---------------- Mesafeli satış ---------------- */

export function DistanceSales() {
  return (
    <Page
      eyebrow="Yasal"
      title={<>Mesafeli satış <em>sözleşmesi</em></>}
      intro="6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca hazırlanmıştır. Sipariş verirken bu metni onaylamış olursun."
    >
      <div className="prose">
        <h2 id="on-bilgilendirme">Ön bilgilendirme formu</h2>
        <h3>Satıcı</h3>
        <SellerInfo />
        <h3>Ürün, fiyat ve ödeme</h3>
        <p>
          Satın alınan ürünlerin adı, adedi, özellikleri ve vergiler dahil satış fiyatı, ödeme adımındaki sipariş özetinde gösterilir. Kargo ücreti{' '}
          {formatPrice(SHIPPING_FEE)}’dir; {formatPrice(FREE_SHIPPING)} ve üzeri siparişlerde kargo ücretsizdir. Ödeme kredi veya banka kartı ile peşin alınır.
        </p>
        <h3>Teslimat</h3>
        <p>
          Stoktaki ürünler 1–3 iş günü, kişiye özel ürünler tasarım onayından itibaren 5–7 iş günü içinde kargoya verilir. Teslimat her durumda siparişten
          itibaren yasal süre olan 30 günü geçmez.
        </p>
        <h3>Cayma hakkı</h3>
        <p>
          Ürünü teslim aldığın günden itibaren 14 gün içinde hiçbir gerekçe göstermeden ve cezai şart ödemeden sözleşmeden cayabilirsin. Mağazamız bu süreyi
          gönüllü olarak <strong>30 güne</strong> uzatmıştır. Cayma bildirimini <Reach /> yazılı olarak
          iletebilirsin. Ayrıntılar <Link to="/iade">İade ve Değişim</Link> sayfasındadır.
        </p>
        <h3>Cayma hakkının kullanılamayacağı durumlar</h3>
        <ul>
          <li>Alıcının istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan kişiye özel ürünler</li>
          <li>Teslimden sonra ambalajı açılmış, sağlık ve hijyen açısından iadesi uygun olmayan ürünler</li>
        </ul>
        <h3>Şikâyet ve itiraz</h3>
        <p>
          Şikâyetlerini yukarıdaki iletişim bilgileri üzerinden iletebilirsin. Uyuşmazlıklarda, Ticaret Bakanlığınca her yıl belirlenen parasal sınırlar dahilinde
          yerleşim yerindeki veya işlemin yapıldığı yerdeki tüketici hakem heyetine ya da tüketici mahkemesine başvurabilirsin.
        </p>

        <h2>Mesafeli satış sözleşmesi</h2>
        <h3>1. Taraflar</h3>
        <p><strong>Satıcı:</strong></p>
        <SellerInfo />
        <p>
          <strong>Alıcı:</strong> Sipariş sırasında ad, soyad, adres, telefon ve e-posta bilgilerini veren kişidir.
        </p>
        <h3>2. Konu</h3>
        <p>
          Bu sözleşme, alıcının satıcıya ait internet sitesi üzerinden elektronik ortamda sipariş ettiği ürünlerin satışı ve teslimiyle ilgili tarafların hak
          ve yükümlülüklerini düzenler.
        </p>
        <h3>3. Ürün ve fiyat</h3>
        <p>
          Ürünlerin türü, adedi, satış fiyatı (vergiler dahil) ve kargo ücreti, siparişin onaylandığı andaki sipariş özetinde belirtildiği gibidir. Fiyatlar
          sipariş onaylandıktan sonra değiştirilemez.
        </p>
        <h3>4. Teslimat</h3>
        <p>
          Ürünler alıcının bildirdiği adrese anlaşmalı kargo firmasıyla, ön bilgilendirme formunda belirtilen sürelerde ve en geç 30 gün içinde teslim edilir.
          Teslimat yapılamazsa alıcı bilgilendirilir ve ödenen tutar 14 gün içinde iade edilir.
        </p>
        <h3>5. Cayma hakkı ve iade</h3>
        <p>
          Alıcı, ürünü teslim aldığı tarihten itibaren 30 gün içinde cayma hakkını kullanabilir. Satıcı, cayma bildiriminin kendisine ulaşmasından itibaren 14 gün
          içinde ürün bedelini alıcının ödeme yaptığı yönteme iade eder. Alıcı, ürünü cayma bildiriminden itibaren 10 gün içinde satıcıya geri gönderir.
          Ön bilgilendirme formunda sayılan ürünlerde cayma hakkı kullanılamaz.
        </p>
        <h3>6. Ayıplı ürün</h3>
        <p>Ürünün ayıplı çıkması hâlinde alıcı, 6502 sayılı Kanun’daki seçimlik haklarını (ücret iadesi, değişim, onarım, indirim) kullanabilir.</p>
        <h3>7. Uyuşmazlıklar</h3>
        <p>
          Bu sözleşmeden doğan uyuşmazlıklarda, parasal sınırlar dahilinde tüketici hakem heyetleri, bu sınırları aşan durumlarda tüketici mahkemeleri yetkilidir.
        </p>
        <h3>8. Yürürlük</h3>
        <p>Alıcı, siparişi onaylamadan önce bu sözleşmeyi ve ön bilgilendirme formunu okuyup onayladığını kabul eder. Sözleşme, sipariş onayıyla yürürlüğe girer.</p>
      </div>
    </Page>
  )
}

/* ---------------- Kullanım koşulları ---------------- */

export function Terms() {
  return (
    <Page eyebrow="Yasal" title={<>Kullanım <em>koşulları</em></>} intro="Bu siteyi kullanarak aşağıdaki koşulları kabul etmiş olursun.">
      <div className="prose">
        <h2>Genel</h2>
        <p>
          Bu internet sitesi {owner()} tarafından işletilmektedir. Site üzerinden yapılan satışlar ayrıca{' '}
          <Link to="/mesafeli-satis">Mesafeli Satış Sözleşmesi</Link>’ne tabidir.
        </p>
        <h2>Fikrî mülkiyet</h2>
        <p>
          Sitedeki tasarımlar, 3D modeller, metinler, logo ve görseller {owner()}’a aittir. İzin alınmadan kopyalanamaz, çoğaltılamaz ve ticari amaçla
          kullanılamaz.
        </p>
        <h2>Ürün bilgileri ve fiyatlar</h2>
        <p>
          Ürün bilgilerinin ve fiyatların doğru olması için özen gösteriyoruz. Baskılı ürünlerde renk, ölçü ve dokuda küçük farklar olabilir. Açık bir fiyat
          hatası olması durumunda siparişi iptal edip ödemenin tamamını iade etme hakkımız saklıdır.
        </p>
        <h2>Kişiye özel siparişler</h2>
        <p>
          Kişiye özel siparişler için gönderdiğin yazı, logo, fotoğraf ve çizimlerin kullanım hakkının sende olduğunu kabul edersin. Başkasının marka veya telif
          hakkını ihlal eden, yasa dışı ya da hakaret içeren tasarımları üretmeme hakkımız vardır.
        </p>
        <h2>Kullanıcı yükümlülükleri</h2>
        <ul>
          <li>Sipariş ve iletişim formlarında doğru bilgi vermek</li>
          <li>Siteyi yasalara aykırı amaçlarla kullanmamak</li>
          <li>Sitenin işleyişini bozacak girişimlerde bulunmamak</li>
        </ul>
        <h2>Sorumluluk</h2>
        <p>
          Sitenin kesintisiz ve hatasız çalışması için çalışıyoruz; ancak teknik arızalar ve bakım çalışmaları nedeniyle oluşabilecek kesintilerden sorumlu
          tutulamayız. Siteden bağlantı verilen başka sitelerin içeriğinden sorumlu değiliz.
        </p>
        <h2>Değişiklikler ve uygulanacak hukuk</h2>
        <p>
          Bu koşulları gerektiğinde güncelleyebiliriz; güncel hâli her zaman bu sayfadadır. Koşullara Türkiye Cumhuriyeti kanunları uygulanır. Tüketici
          uyuşmazlıklarında tüketici hakem heyetleri ve tüketici mahkemeleri yetkilidir.
        </p>
      </div>
    </Page>
  )
}

/* ---------------- Gizlilik ve çerezler ---------------- */

export function Privacy() {
  return (
    <Page
      eyebrow="Yasal"
      title={<>Gizlilik ve <em>çerezler</em></>}
      intro="Hangi bilgileri topladığımızı, neden topladığımızı ve nasıl koruduğumuzu sade bir dille anlatıyoruz."
    >
      <div className="prose">
        <h2>Topladığımız bilgiler</h2>
        <ul>
          <li><strong>Üye olurken:</strong> ad, soyad, e-posta, isteğe bağlı telefon ve şifren (yalnızca geri çözülemeyen özet olarak)</li>
          <li><strong>Sipariş verirken:</strong> ad, soyad, e-posta, telefon ve teslimat adresi</li>
          <li><strong>Bize yazarken:</strong> ad, e-posta ve mesajın</li>
          <li><strong>Bültene katılırken:</strong> e-posta adresin</li>
          <li><strong>Siteyi gezerken:</strong> sepetin ve çerez tercihlerin (tarayıcında saklanır)</li>
        </ul>
        <p>Kart bilgilerini hiçbir zaman saklamıyoruz.</p>

        <h2>Bilgileri ne için kullanıyoruz?</h2>
        <p>
          Siparişini hazırlamak ve teslim etmek, sorularını yanıtlamak, yasal yükümlülüklerimizi yerine getirmek ve yalnızca izin verirsen kampanyalardan haberdar
          etmek için. Bilgilerini satmıyor, reklam amacıyla başkalarıyla paylaşmıyoruz.
        </p>

        <h2 id="cerezler">Çerezler</h2>
        {SITE.analyticsId ? (
          <>
            <p>Sitemizde iki tür çerez kullanılır:</p>
            <ul>
              <li>
                <strong>Zorunlu çerezler:</strong> Sepetinin ve çerez tercihinin hatırlanması için gereklidir. Bunlar olmadan site düzgün çalışmaz, bu yüzden
                onay gerektirmez.
              </li>
              <li>
                <strong>Analiz çerezleri (Google Analytics):</strong> Sitenin nasıl kullanıldığını anonim olarak ölçmemize yardımcı olur. Yalnızca çerez
                bandında <strong>“Kabul et”</strong> dersen çalışır.
              </li>
            </ul>
            <p>
              Tercihini istediğin zaman{' '}
              <button className="prose__btn" onClick={() => window.dispatchEvent(new Event('cookie-settings'))}>
                çerez ayarlarından
              </button>{' '}
              değiştirebilirsin.
            </p>
          </>
        ) : (
          <p>
            Sitemiz yalnızca <strong>zorunlu çerezler</strong> kullanır: sepetinin hatırlanması gibi, site çalışsın diye gereken bilgiler tarayıcında saklanır.
            Reklam ya da takip çerezi kullanılmaz. Bu bilgileri tarayıcı ayarlarından dilediğin zaman silebilirsin.
          </p>
        )}

        <h2>Güvenlik ve saklama süresi</h2>
        <p>
          Site ile aranızdaki tüm bağlantılar SSL ile şifrelenir. Bilgilerini, yasal saklama süreleri boyunca ve işleme amacı devam ettiği sürece saklar, sonra
          siler veya anonim hâle getiririz.
        </p>

        <h2>Haklarınız</h2>
        <p>
          Bilgilerine erişme, düzeltme ve silinmesini isteme hakların hakkında ayrıntılı bilgi <Link to="/kvkk">KVKK Aydınlatma Metni</Link>’nde yer alır. Her
          türlü soru için <Reach /> yazabilirsin.
        </p>
      </div>
    </Page>
  )
}

/* ---------------- Teşekkürler ---------------- */

const readOrder = () => {
  try {
    return JSON.parse(sessionStorage.getItem('last-order'))
  } catch {
    return null
  }
}

export function ThankYou() {
  const [order] = useState(readOrder)
  return (
    <Page
      eyebrow="Sipariş alındı"
      title={<>Teşekkürler, <em>siparişin yolda</em></>}
      intro={order ? `Sipariş özetini ${order.email} adresine göndereceğiz.` : 'Siparişin için teşekkür ederiz.'}
    >
      {order && (
        <Reveal className="order">
          <div>
            <small>Sipariş numarası</small>
            <strong>{order.no}</strong>
          </div>
          <div>
            <small>Toplam</small>
            <strong>{formatPrice(order.total)}</strong>
          </div>
        </Reveal>
      )}
      <Reveal className="page__block">
        <h2 className="display page__h2">Şimdi ne olacak?</h2>
        <ol className="steps">
          <li>
            <strong>Onay</strong>
            <span className="muted">Sipariş özetin e-postana gelir.</span>
          </li>
          <li>
            <strong>Hazırlık</strong>
            <span className="muted">Ürünün atölyede özenle hazırlanır.</span>
          </li>
          <li>
            <strong>Kargo</strong>
            <span className="muted">1–3 iş günü içinde takip numaran gelir.</span>
          </li>
          <li>
            <strong>Teslimat</strong>
            <span className="muted">Hediye kutusunda kapına ulaşır.</span>
          </li>
        </ol>
      </Reveal>
      <Reveal className="page__cta">
        <p className="muted">Sorun mu var? Sipariş numaranla bize yaz.</p>
        <div className="hero__cta">
          <Link className="btn btn--primary" to="/">Alışverişe Devam Et</Link>
          <Link className="btn btn--ghost" to="/iletisim">Bize Yaz</Link>
        </div>
      </Reveal>
    </Page>
  )
}

/* ---------------- 404 ---------------- */

export function NotFound() {
  return (
    <Page eyebrow="404" title={<>Bu sayfa <em>kayıp</em></>} intro="Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.">
      <div className="hero__cta">
        <Link className="btn btn--primary" to="/">Ana Sayfaya Dön</Link>
        <Link className="btn btn--ghost" to="/iletisim">Bize Yaz</Link>
      </div>
    </Page>
  )
}
