import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ROUTES, SITE } from './src/data/site.js'

// Derleme sırasında sayfa listesinden sitemap.xml ve robots.txt üretir
function seoFiles() {
  return {
    name: 'seo-files',
    // index.html içindeki site adresini site.js'teki adresle eşitle
    transformIndexHtml: (html) => html.replaceAll('https://zela47.com.tr', SITE.url),
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      const urls = Object.keys(ROUTES)
        .map((p) => `  <url><loc>${SITE.url}${p === '/' ? '/' : p}</loc><lastmod>${today}</lastmod><priority>${p === '/' ? '1.0' : '0.6'}</priority></url>`)
        .join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /tesekkurler\nDisallow: /panel\n\nSitemap: ${SITE.url}/sitemap.xml\n`
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), seoFiles()],
  base: '/',
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Büyük 3D kütüphanelerini ayrı dosyalara böl: site metni önce açılır, 3D arkadan gelir
        manualChunks(id) {
          // Vite'ın küçük yardımcıları her zaman yüklenen dosyada kalsın, yoksa 3D dosyası baştan iner
          if (id.includes('preload-helper') || id.includes('commonjsHelpers')) return 'react'
          if (!id.includes('node_modules')) return
          if (/node_modules\/(react|react-dom|scheduler|use-sync-external-store)\//.test(id)) return 'react'
          if (/node_modules\/(postprocessing|@react-three\/postprocessing)\//.test(id)) return 'postfx'
          if (/node_modules\/three\//.test(id)) return 'three'
          if (/node_modules\/(@react-three|three-stdlib|maath|camera-controls|troika|@monogrid|detect-gpu|stats|suspend-react|its-fine|zustand|react-reconciler)/.test(id)) return 'r3f'
        }
      }
    }
  }
})
