import { getSettings } from '../store/admin'

// Mağaza ve şirket bilgileri. Boş bırakılan alanlar sitede gösterilmez.
export const SITE = {
  name: 'ZELA 47',
  company: '', // Resmî şirket unvanı (ör. "Ad Soyad - ZELA 47" veya "X Ltd. Şti.")
  taxInfo: '', // Vergi dairesi ve numarası
  email: '', // Sitede gösterilen iletişim e-postası. Kullanıcı isteğiyle kaldırıldı (11.11.2026); boşken iletişim formu mesajı WhatsApp ile gönderir
  phone: '', // ör. '+90 5xx xxx xx xx'
  whatsapp: '0532 565 42 88', // WhatsApp destek hattı, ör. '+90 5xx xxx xx xx'. Boşsa WhatsApp butonu gösterilmez
  address: 'Tokat Merkez, Türkiye',
  hours: 'Hafta içi 09:00 – 18:00',
  instagram: '', // Instagram profil adresi, ör. 'https://instagram.com/zela47'. Boşsa bağlantı gösterilmez
  url: 'https://zela47.com.tr', // Sitenin yayındaki adresi (sitemap ve paylaşım görseli için). Alan adı henüz alınmadı
  analyticsId: '' // Google Analytics 4 ölçüm kimliği (ör. 'G-XXXXXXX'). Boşsa analytics ve çerez bandı kapalıdır
}

// Yönetim panelinde değiştirilen iletişim bilgileri (boş bırakılan alan da geçerlidir: o bilgi gizlenir)
const custom = getSettings()
for (const k of ['email', 'phone', 'whatsapp', 'address', 'hours', 'instagram']) if (typeof custom[k] === 'string') SITE[k] = custom[k]

// Sayfa adresleri, başlıkları ve Google'da görünecek açıklamaları
export const ROUTES = {
  '/': ['ZELA 47 — Baskılı Tişört ve Eşofman', 'Kendi tasarımlarımızla baskılı tişört ve eşofmanlar, kişiye özel baskı. 1.500 ₺ üzeri ücretsiz kargo.'],
  '/hakkimizda': ['Hakkımızda', 'Kendi tasarımı baskılı tişört ve eşofmanlar üreten Tokat merkezli bir marka. Hikâyemiz ve üretim sürecimiz.'],
  '/tasarla': ['Kendin Tasarla', 'Tişörtünü ya da eşofman takımını kendin tasarla: fotoğraf, yazı ve şekil ekle, 3D önizlemede gör, sipariş ver.'],
  '/giris': ['Giriş Yap', 'ZELA 47 hesabına giriş yap: siparişlerini takip et, bilgilerini kaydet.'],
  '/kayit': ['Kayıt Ol', 'ZELA 47 üyesi ol: siparişlerini takip et, bilgilerin ödeme sayfasında hazır gelsin.'],
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
