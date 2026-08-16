import { Product } from '../app/data/products'

// Persistent admin/inventory state is stored in Neon PostgreSQL through /api/kv.
const KEYS = {
  STOCK_STATUS: 'kefas_stock_status',
  PRODUCT_PRICES: 'kefas_product_prices',
  VARIANT_PRICES: 'kefas_variant_prices',
  ALL_PRODUCTS: 'kefas_all_products',
  COMING_SOON_ENABLED: 'kefas_coming_soon_enabled',
  COMING_SOON_PRODUCTS: 'kefas_coming_soon_products',
  CUSTOM_PRODUCTS: 'kefas_custom_products',
} as const

type KVKey = (typeof KEYS)[keyof typeof KEYS]

async function getFromKV(key: KVKey): Promise<any | null> {
  try {
    const response = await fetch(`/api/kv?key=${encodeURIComponent(key)}`, { method: 'GET', cache: 'no-store' })
    if (!response.ok) return null
    const data = await response.json()
    return data?.value ?? null
  } catch (error) {
    console.error(`Failed to load Neon KV key ${key}:`, error)
    return null
  }
}

async function setInKV(key: KVKey, value: unknown): Promise<boolean> {
  try {
    const response = await fetch('/api/kv', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    if (!response.ok) {
      console.error(`Failed to save Neon KV key ${key}:`, await response.text())
      return false
    }
    return true
  } catch (error) {
    console.error(`Failed to save Neon KV key ${key}:`, error)
    return false
  }
}

export async function syncFromNeon(): Promise<void> {
  const values = await Promise.all([
    getFromKV(KEYS.STOCK_STATUS),
    getFromKV(KEYS.PRODUCT_PRICES),
    getFromKV(KEYS.VARIANT_PRICES),
    getFromKV(KEYS.ALL_PRODUCTS),
    getFromKV(KEYS.COMING_SOON_ENABLED),
    getFromKV(KEYS.COMING_SOON_PRODUCTS),
    getFromKV(KEYS.CUSTOM_PRODUCTS),
  ])
  const keys: KVKey[] = [
    KEYS.STOCK_STATUS, KEYS.PRODUCT_PRICES, KEYS.VARIANT_PRICES,
    KEYS.ALL_PRODUCTS, KEYS.COMING_SOON_ENABLED, KEYS.COMING_SOON_PRODUCTS,
    KEYS.CUSTOM_PRODUCTS,
  ]
  values.forEach((value, i) => {
    if (value !== null) localStorage.setItem(keys[i], JSON.stringify(value))
  })
}

export async function syncToNeon(key: KVKey, value: unknown): Promise<boolean> {
  return setInKV(key, value)
}

export async function syncAllToNeon(): Promise<void> {
  const entries = (Object.values(KEYS) as KVKey[]).map(key => [key, localStorage.getItem(key)] as const)
  const updates = entries.filter(([, value]) => value !== null).map(([key, value]) => setInKV(key, JSON.parse(value!)))
  const results = await Promise.all(updates)
  const successCount = results.filter(Boolean).length
  if (updates.length > 0 && successCount === 0) throw new Error('No items were synced to Neon')
}

export const stockStatusSync = {
  async save(value: Record<string, boolean>) { localStorage.setItem(KEYS.STOCK_STATUS, JSON.stringify(value)); return syncToNeon(KEYS.STOCK_STATUS, value) },
  async load() { return getFromKV(KEYS.STOCK_STATUS) as Promise<Record<string, boolean> | null> },
}

export const productPricesSync = {
  async save(prices: Record<string, number>, variantPrices: Record<string, Record<string, number>>) {
    localStorage.setItem(KEYS.PRODUCT_PRICES, JSON.stringify(prices))
    localStorage.setItem(KEYS.VARIANT_PRICES, JSON.stringify(variantPrices))
    const [a, b] = await Promise.all([syncToNeon(KEYS.PRODUCT_PRICES, prices), syncToNeon(KEYS.VARIANT_PRICES, variantPrices)])
    return a && b
  },
  async load() {
    const [productPrices, variantPrices] = await Promise.all([getFromKV(KEYS.PRODUCT_PRICES), getFromKV(KEYS.VARIANT_PRICES)])
    return { productPrices, variantPrices }
  },
}

export const comingSoonSync = {
  async save(enabled: boolean, products: string[]) {
    localStorage.setItem(KEYS.COMING_SOON_ENABLED, JSON.stringify(enabled))
    localStorage.setItem(KEYS.COMING_SOON_PRODUCTS, JSON.stringify(products))
    const [a, b] = await Promise.all([syncToNeon(KEYS.COMING_SOON_ENABLED, enabled), syncToNeon(KEYS.COMING_SOON_PRODUCTS, products)])
    return a && b
  },
  async load() {
    const [enabled, products] = await Promise.all([getFromKV(KEYS.COMING_SOON_ENABLED), getFromKV(KEYS.COMING_SOON_PRODUCTS)])
    return { enabled, products }
  },
}

export const productsSync = {
  async save(products: Product[]) { localStorage.setItem(KEYS.ALL_PRODUCTS, JSON.stringify(products)); return syncToNeon(KEYS.ALL_PRODUCTS, products) },
  async load() { return getFromKV(KEYS.ALL_PRODUCTS) as Promise<Product[] | null> },
}

export const customProductsSync = {
  async save(products: Product[]) { localStorage.setItem(KEYS.CUSTOM_PRODUCTS, JSON.stringify(products)); return syncToNeon(KEYS.CUSTOM_PRODUCTS, products) },
  async load() { return getFromKV(KEYS.CUSTOM_PRODUCTS) as Promise<Product[] | null> },
}

// Legacy names kept temporarily so older components still compile.
// These are aliases to Neon only; no Supabase request is made.
export const syncFromSupabase = syncFromNeon
export const syncToSupabase = syncToNeon

export { KEYS }
