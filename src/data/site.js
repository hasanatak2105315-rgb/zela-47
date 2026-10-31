// Mağaza ve şirket bilgileri. Boş bırakılan alanlar sitede gösterilmez.
export const SITE = {
  name: 'ZELA 47',
  company: '', // Resmî şirket unvanı (ör. "Ad Soyad - ZELA 47" veya "X Ltd. Şti.")
  taxInfo: '', // Vergi dairesi ve numarası
  email: 'hasanatak.2105315@gmail.com',
  phone: '', // ör. '+90 5xx xxx xx xx'
  whatsapp: '0532 565 42 88', // WhatsApp destek hattı, ör. '+90 5xx xxx xx xx'. Boşsa WhatsApp butonu gösterilmez
  address: 'Tokat Merkez, Türkiye',
  hours: 'Hafta içi 09:00 – 18:00',
  instagram: '#',
  url: 'https://zela47.com.tr', // Sitenin yayındaki adresi (sitemap ve paylaşım görseli için). Alan adı henüz alınmadı
  analyticsId: '' // Google Analytics 4 ölçüm kimliği (ör. 'G-XXXXXXX'). Boşsa analytics ve çerez bandı kapalıdır
}

// Sayfa adresleri, başlıkları ve Google'da görünecek açıklamaları
export const ROUTES = {
  '/': ['ZELA 47 — Baskılı Tişört ve Eşofman', 'Kendi tasarımlarımızla baskılı tişört ve eşofmanlar, kişiye özel baskı. 1.500 ₺ üzeri ücretsiz kargo.'],
  '/hakkimizda': ['Hakkımızda', 'Kendi tasarımı baskılı tişört ve eşofmanlar üreten Tokat merkezli bir marka. Hikâyemiz ve üretim sürecimiz.'],
  '/iletisim': ['İletişim', 'Sipariş, kişiye özel baskı ya da iade için bize ulaş. WhatsApp destek hattı ve e-posta ile en geç bir iş günü içinde dönüyoruz.'],
  '/sss': ['Sıkça Sorulan Sorular', 'Kargo süresi, beden seçimi, kumaş ve yıkama, kişiye özel baskı, ödeme ve iade hakkında sık sorulan sorular.'],
  '/iade': ['İade ve Değişim', '30 gün içinde koşulsuz iade. İade adımları, iade edilemeyen ürünler ve değişim koşulları.'],
  '/kvkk': ['KVKK Aydınlatma Metni', '6698 sayılı KVKK kapsamında kişisel verilerinin nasıl işlendiğine dair aydınlatma metni.'],
  '/gizlilik': ['Gizlilik ve Çerez Politikası', 'Hangi bilgileri topladığımız, çerezleri nasıl kullandığımız ve verilerini nasıl koruduğumuz.'],
  '/kullanim-kosullari': ['Kullanım Koşulları', 'ZELA 47 internet sitesinin kullanım koşulları.'],
  '/mesafeli-satis': ['Mesafeli Satış Sözleşmesi', 'Ön bilgilendirme formu ve mesafeli satış sözleşmesi.']
}

export const owner = () => SITE.company || SITE.name

// WhatsApp sohbet bağlantısı (numara yoksa null). 05xx ile yazılan numaralar 90 ile başlayacak şekilde düzeltilir
export function whatsappLink(text = '') {
  let n = SITE.whatsapp.replace(/\D/g, '')
  if (!n) return null
  if (n.startsWith('0')) n = '9' + n
  else if (n.length === 10) n = '90' + n
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
