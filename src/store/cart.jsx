import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { PRODUCTS } from '../data/products'

const CartContext = createContext(null)
const KEY = 'tx-cart'

// Sepet satırı: aynı ürün farklı beden, renk ya da kişiye özel baskıyla ayrı satırda durur
// Tasarım stüdyosundan gelen her tasarımın kendi kimliği (custom.id) vardır, ayrı satırda durur
const lineKey = (id, size, custom, color) => [id, size ?? '', custom?.text ?? '', custom?.place ?? '', color ?? '', custom?.id ?? ''].join('|')

const load = () => {
  try {
    const items = JSON.parse(localStorage.getItem(KEY)) ?? []
    return items.filter((i) => PRODUCTS.some((p) => p.id === i.id)).map((i) => ({ ...i, key: i.key ?? lineKey(i.id, i.size, i.custom, i.color) }))
  } catch {
    return []
  }
}

export const FREE_SHIPPING = 1500
export const SHIPPING_FEE = 79
// Kişiye özel baskının ürün başına ek ücreti (0 ise ücretsiz, sitede ek ücret yazmaz)
export const CUSTOM_PRINT_FEE = 0

export const unitPrice = (product, custom) => product.price + (custom ? CUSTOM_PRINT_FEE : 0)

export function CartProvider({ children }) {
  const [items, setItems] = useState(load)
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const value = useMemo(() => {
    const lines = items.map((i) => ({ ...i, product: PRODUCTS.find((p) => p.id === i.id) }))
    const subtotal = lines.reduce((s, l) => s + unitPrice(l.product, l.custom) * l.qty, 0)
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE
    return {
      lines,
      open,
      toast,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
      setOpen,
      // opts: { size, color (renk adı), custom: { text, place, id?, previews? } }
      add(id, qty = 1, { size, color, custom } = {}) {
        const key = lineKey(id, size, custom, color)
        setItems((prev) => {
          const found = prev.find((i) => i.key === key)
          return found ? prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i)) : [...prev, { key, id, qty, size, color, custom }]
        })
        setToast(`${PRODUCTS.find((p) => p.id === id).name} sepete eklendi`)
      },
      setQty(key, qty) {
        setItems((prev) => (qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, qty } : i))))
      },
      clear: () => setItems([])
    }
  }, [items, open, toast])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
