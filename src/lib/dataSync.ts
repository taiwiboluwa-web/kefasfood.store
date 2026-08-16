import { products as staticProducts, Product } from '../app/data/products'

// Neon PostgreSQL is the single source of truth for persistent admin/inventory state.
// The existing storefront catalog is seeded into Neon automatically when the cloud catalog is empty.
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

function initialStock(products: Product[]): Record<string, boolean> {
  return Object.fromEntries(products.map(product => [product.id, product.inStock !== false]))
}

function initialPrices(products: Product[]): Record<string, number> {
  return Object.fromEntries(products.map(product => [product.id, product.price]))
}

function initialVariantPrices(products: Product[]): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {}
  products.forEach(product => {
    if (product.variants?.length) {
      result[product.id] = Object.fromEntries(product.variants.map(variant => [variant.weight, variant.price]))
    }
  })
  return result
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

  const [stockStatus, productPrices, variantPrices, allProducts, comingSoonEnabled, comingSoonProducts, customProducts] = values
  const catalog: Product[] = Array.isArray(allProducts) && allProducts.length ? allProducts : [...staticProducts]

  const resolvedStock = stockStatus ?? initialStock(catalog)
  const resolvedPrices = productPrices ?? initialPrices(catalog)
  const resolvedVariantPrices = variantPrices ?? initialVariantPrices(catalog)
  const resolvedComingSoonEnabled = comingSoonEnabled ?? false
  const resolvedComingSoonProducts = Array.isArray(comingSoonProducts) ? comingSoonProducts : []
  const resolvedCustomProducts = Array.isArray(customProducts) ? customProducts : []

  const writes: Promise<boolean>[] = []
  if (!Array.isArray(allProducts) || allProducts.length === 0) writes.push(setInKV(KEYS.ALL_PRODUCTS, catalog))
  if (stockStatus === null) writes.push(setInKV(KEYS.STOCK_STATUS, resolvedStock))
  if (productPrices === null) writes.push(setInKV(KEYS.PRODUCT_PRICES, resolvedPrices))
  if (variantPrices === null) writes.push(setInKV(KEYS.VARIANT_PRICES, resolvedVariantPrices))
  if (comingSoonEnabled === null) writes.push(setInKV(KEYS.COMING_SOON_ENABLED, false))
  if (comingSoonProducts === null) writes.push(setInKV(KEYS.COMING_SOON_PRODUCTS, []))
  if (customProducts === null) writes.push(setInKV(KEYS.CUSTOM_PRODUCTS, []))
  if (writes.length) await Promise.all(writes)

  const localValues: Array<[KVKey, unknown]> = [
    [KEYS.STOCK_STATUS, resolvedStock],
    [KEYS.PRODUCT_PRICES, resolvedPrices],
    [KEYS.VARIANT_PRICES, resolvedVariantPrices],
    [KEYS.ALL_PRODUCTS, catalog],
    [KEYS.COMING_SOON_ENABLED, resolvedComingSoonEnabled],
    [KEYS.COMING_SOON_PRODUCTS, resolvedComingSoonProducts],
    [KEYS.CUSTOM_PRODUCTS, resolvedCustomProducts],
  ]
  localValues.forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)))
}

export async function syncToNeon(key: KVKey, value: unknown): Promise<boolean> {
  return setInKV(key, value)
}

export async function syncAllToNeon(): Promise<void> {
  const storedCatalog = localStorage.getItem(KEYS.ALL_PRODUCTS)
  const parsedCatalog = storedCatalog ? JSON.parse(storedCatalog) : null
  const catalog = Array.isArray(parsedCatalog) && parsedCatalog.length ? parsedCatalog : staticProducts
  const entries: Array<[KVKey, unknown]> = [[KEYS.ALL_PRODUCTS, catalog]]
  ;(Object.values(KEYS) as KVKey[]).filter(key => key !== KEYS.ALL_PRODUCTS).forEach(key => {
    const value = localStorage.getItem(key)
    if (value !== null) entries.push([key, JSON.parse(value)])
  })
  const results = await Promise.all(entries.map(([key, value]) => setInKV(key, value)))
  if (results.length > 0 && results.every(result => !result)) throw new Error('No items were synced to Neon')
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
  async save(products: Product[]) {
    const catalog = products.length ? products : staticProducts
    localStorage.setItem(KEYS.ALL_PRODUCTS, JSON.stringify(catalog))
    return syncToNeon(KEYS.ALL_PRODUCTS, catalog)
  },
  async load() {
    const value = await getFromKV(KEYS.ALL_PRODUCTS)
    if (Array.isArray(value) && value.length) return value as Product[]
    await setInKV(KEYS.ALL_PRODUCTS, staticProducts)
    return staticProducts
  },
}

export const customProductsSync = {
  async save(products: Product[]) { localStorage.setItem(KEYS.CUSTOM_PRODUCTS, JSON.stringify(products)); return syncToNeon(KEYS.CUSTOM_PRODUCTS, products) },
  async load() { return getFromKV(KEYS.CUSTOM_PRODUCTS) as Promise<Product[] | null> },
}

// Legacy names retained for source compatibility. They are Neon-only aliases.
export const syncFromSupabase = syncFromNeon
export const syncToSupabase = syncToNeon
export const syncAllToSupabase = syncAllToNeon

export { KEYS }
