import { ROUTES, SITE } from './data/site'

const setTag = (selector, attrs) => {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
    document.head.appendChild(el)
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
}

// Sayfa değişince sekme başlığını, Google açıklamasını ve paylaşım bilgilerini günceller
export function applyMeta(path) {
  const found = ROUTES[path]
  const [name, description] =
    path === '/tesekkurler' ? ['Siparişin alındı', 'Siparişin için teşekkürler.'] : path === '/panel' ? ['Yönetim Paneli', 'ZELA 47 yönetim paneli.'] : path === '/hesabim' ? ['Hesabım', 'ZELA 47 hesabın.'] : found ?? ['Sayfa bulunamadı', 'Aradığın sayfa bulunamadı.']
  const title = path === '/' ? name : `${name} — ${SITE.name}`
  const url = SITE.url + (path === '/' ? '/' : path)

  document.title = title
  setTag('meta[name="description"]', { name: 'description', content: description })
  setTag('meta[name="robots"]', { name: 'robots', content: found ? 'index, follow' : 'noindex' })
  setTag('link[rel="canonical"]', { rel: 'canonical', href: url })
  setTag('meta[property="og:title"]', { property: 'og:title', content: title })
  setTag('meta[property="og:description"]', { property: 'og:description', content: description })
  setTag('meta[property="og:url"]', { property: 'og:url', content: url })
}
