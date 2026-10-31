import { useState } from 'react'
import { motion } from 'motion/react'
import { SITE, owner, whatsappLink } from '../data/site'
import { WhatsAppIcon } from './Extras'
import { FREE_SHIPPING, SHIPPING_FEE } from '../store/cart'
import { formatPrice } from '../data/products'
import { Link } from '../router'

const ease = [0.22, 1, 0.36, 1]

const Reveal = ({ children, delay = 0, className }) => (
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

// Tüm alt sayfaların ortak başlığı
function Page({ eyebrow, title, intro, children }) {
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
    // Sunucu olmadığı için mesaj, ziyaretçinin e-posta uygulamasında hazır açılır
    const body = `${form.message}\n\n${form.name} — ${form.email}${form.phone.trim() ? ` — ${form.phone.trim()}` : ''}`
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(`${form.topic} — ${form.name}`)}&body=${encodeURIComponent(body)}`
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
          <div>
            <small>E-posta</small>
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </div>
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
          <div>
            <small>Sosyal medya</small>
            <a href={SITE.instagram}>Instagram</a>
          </div>
          <p className="muted">
            Sık sorulan sorulara <Link to="/sss">SSS sayfamızdan</Link> hemen ulaşabilirsin.
          </p>
        </Reveal>

        <Reveal className="contact__form" delay={0.05}>
          {sent ? (
            <div className="contact__done">
              <div className="done-mark">✓</div>
              <h2 className="display">Mesajın hazır</h2>
              <p className="muted">
                E-posta uygulaman mesajınla birlikte açıldı, göndermeyi unutma. Açılmadıysa doğrudan{' '}
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a> adresine yazabilirsin.
              </p>
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
      ['Kendi tasarımımı bastırabilir miyim?', 'Evet. Çizimini, logonu, fotoğrafını ya da 3D modelini (STL) WhatsApp ya da e-posta ile gönderebilirsin. Basılabilirliğini kontrol edip süre bilgisi veriyoruz.']
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
            <Link to="/iletisim">İletişim sayfasından</Link> ya da <a href={`mailto:${SITE.email}`}>{SITE.email}</a> adresinden sipariş numaranla birlikte bize yaz.
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

export function Kvkk() {
  return (
    <Page
      eyebrow="Yasal"
      title={<>KVKK <em>aydınlatma metni</em></>}
      intro="6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinin nasıl işlendiğini aşağıda açıklıyoruz."
    >
      <div className="prose">
        <h2>Veri sorumlusu</h2>
        <p>
          Kişisel verilerin, veri sorumlusu sıfatıyla <strong>{owner()}</strong> ({SITE.address}) tarafından işlenmektedir.
        </p>

        <h2>İşlenen kişisel veriler</h2>
        <ul>
          <li><strong>Kimlik:</strong> ad, soyad</li>
          <li><strong>İletişim:</strong> e-posta adresi, telefon numarası, teslimat adresi</li>
          <li><strong>Müşteri işlem:</strong> sipariş bilgileri, talep ve şikâyetler</li>
          <li><strong>İşlem güvenliği:</strong> IP adresi, tarayıcı ve çerez bilgileri</li>
          <li><strong>Pazarlama:</strong> bülten aboneliği için e-posta adresi (yalnızca izin verirsen)</li>
        </ul>
        <p>Kart bilgilerin tarafımızca saklanmaz; ödeme işlemleri lisanslı ödeme kuruluşu üzerinden yapılır.</p>

        <h2>İşleme amaçları</h2>
        <ul>
          <li>Siparişlerinin alınması, hazırlanması, teslim edilmesi ve faturalandırılması</li>
          <li>İade, değişim ve müşteri hizmetleri taleplerinin yanıtlanması</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          <li>Site güvenliğinin sağlanması</li>
          <li>İzin vermen hâlinde kampanya ve yeni ürün duyurularının gönderilmesi</li>
        </ul>

        <h2>Hukuki sebepler ve toplama yöntemi</h2>
        <p>
          Kişisel verilerin; internet sitemizdeki sipariş, iletişim ve bülten formları ile çerezler aracılığıyla elektronik ortamda toplanır. Bu veriler KVKK’nın 5.
          maddesindeki sözleşmenin kurulması ve ifası, hukuki yükümlülüğün yerine getirilmesi ve meşru menfaat hukuki sebeplerine; bülten ve pazarlama iletileri
          için ise açık rızana dayanılarak işlenir.
        </p>

        <h2>Aktarım</h2>
        <p>
          Kişisel verilerin yalnızca yukarıdaki amaçlarla sınırlı olarak; kargo firmalarına, ödeme kuruluşlarına, barındırma ve e-posta hizmeti sağlayıcılarına ve
          talep hâlinde yetkili kamu kurumlarına aktarılabilir.
        </p>

        <h2>Haklarınız</h2>
        <p>KVKK’nın 11. maddesi uyarınca;</p>
        <ul>
          <li>Kişisel verilerinin işlenip işlenmediğini öğrenme ve bilgi talep etme,</li>
          <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
          <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
          <li>Eksik veya yanlış işlenmişse düzeltilmesini, şartları oluştuğunda silinmesini isteme,</li>
          <li>Otomatik sistemlerle analiz sonucu aleyhine bir sonuç çıkmasına itiraz etme,</li>
          <li>Kanuna aykırı işleme nedeniyle zarara uğradıysan zararın giderilmesini talep etme</li>
        </ul>
        <p>
          haklarına sahipsin. Taleplerini <a href={`mailto:${SITE.email}`}>{SITE.email}</a> adresine yazılı olarak iletebilirsin. Başvurun en geç 30 gün içinde
          ücretsiz olarak sonuçlandırılır.
        </p>

        <h2 id="cerez">Çerezler</h2>
        <p>
          Sitemiz, sepetinin hatırlanması gibi zorunlu işlevler için tarayıcında küçük veriler saklar. Analiz çerezleri yalnızca onay verirsen kullanılır.
          Ayrıntılar <Link to="/gizlilik">Gizlilik ve Çerez Politikası</Link>’ndadır.
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
      <li><strong>E-posta:</strong> <a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
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
          gönüllü olarak <strong>30 güne</strong> uzatmıştır. Cayma bildirimini <a href={`mailto:${SITE.email}`}>{SITE.email}</a> adresine yazılı olarak
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
          türlü soru için <a href={`mailto:${SITE.email}`}>{SITE.email}</a> adresine yazabilirsin.
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
