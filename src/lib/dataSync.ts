import { products as staticProducts, Product } from '../app/data/products'

// Neon PostgreSQL is the single source of truth for persistent admin/inventory state.
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
    const data = await response.json().catch(() => null)
    if (!response.ok || data?.ok !== true) {
      console.error(`Failed to save Neon KV key ${key}:`, data || response.status)
      return false
    }
    return true
  } catch (error) {
    console.error(`Failed to save Neon KV key ${key}:`, error)
    return false
  }
}

async function requireNeonSave(key: KVKey, value: unknown): Promise<void> {
  if (!await setInKV(key, value)) throw new Error(`Neon persistence failed for ${key}`)
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
    if (product.variants?.length) result[product.id] = Object.fromEntries(product.variants.map(variant => [variant.weight, variant.price]))
  })
  return result
}

function publishNeonUpdate(key: KVKey, value: unknown) {
  if (typeof window === 'undefined') return
  const events: Record<KVKey, string> = {
    [KEYS.STOCK_STATUS]: 'kefas_stock_updated',
    [KEYS.PRODUCT_PRICES]: 'kefas_prices_updated',
    [KEYS.VARIANT_PRICES]: 'kefas_prices_updated',
    [KEYS.ALL_PRODUCTS]: 'kefas_products_updated',
    [KEYS.COMING_SOON_ENABLED]: 'kefas_coming_soon_updated',
    [KEYS.COMING_SOON_PRODUCTS]: 'kefas_coming_soon_updated',
    [KEYS.CUSTOM_PRODUCTS]: 'kefas_products_updated',
  }
  const eventName = events[key]
  if (key === KEYS.PRODUCT_PRICES || key === KEYS.VARIANT_PRICES) {
    window.dispatchEvent(new CustomEvent('kefas_prices_updated', {
      detail: {
        productPrices: JSON.parse(localStorage.getItem(KEYS.PRODUCT_PRICES) || '{}'),
        variantPrices: JSON.parse(localStorage.getItem(KEYS.VARIANT_PRICES) || '{}'),
      },
    }))
    return
  }
  window.dispatchEvent(new CustomEvent(eventName, { detail: value }))
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

  const writes: Promise<void>[] = []
  if (!Array.isArray(allProducts) || allProducts.length === 0) writes.push(requireNeonSave(KEYS.ALL_PRODUCTS, catalog))
  if (stockStatus === null) writes.push(requireNeonSave(KEYS.STOCK_STATUS, resolvedStock))
  if (productPrices === null) writes.push(requireNeonSave(KEYS.PRODUCT_PRICES, resolvedPrices))
  if (variantPrices === null) writes.push(requireNeonSave(KEYS.VARIANT_PRICES, resolvedVariantPrices))
  if (comingSoonEnabled === null) writes.push(requireNeonSave(KEYS.COMING_SOON_ENABLED, false))
  if (comingSoonProducts === null) writes.push(requireNeonSave(KEYS.COMING_SOON_PRODUCTS, []))
  if (customProducts === null) writes.push(requireNeonSave(KEYS.CUSTOM_PRODUCTS, []))
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
  localValues.forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value))
    publishNeonUpdate(key, value)
  })
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
  await Promise.all(entries.map(([key, value]) => requireNeonSave(key, value)))
}

export const stockStatusSync = {
  async save(value: Record<string, boolean>) { localStorage.setItem(KEYS.STOCK_STATUS, JSON.stringify(value)); await requireNeonSave(KEYS.STOCK_STATUS, value) },
  async load() { return getFromKV(KEYS.STOCK_STATUS) as Promise<Record<string, boolean> | null> },
}

export const productPricesSync = {
  async save(prices: Record<string, number>, variantPrices: Record<string, Record<string, number>>) {
    localStorage.setItem(KEYS.PRODUCT_PRICES, JSON.stringify(prices))
    localStorage.setItem(KEYS.VARIANT_PRICES, JSON.stringify(variantPrices))
    await Promise.all([requireNeonSave(KEYS.PRODUCT_PRICES, prices), requireNeonSave(KEYS.VARIANT_PRICES, variantPrices)])
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
    await Promise.all([requireNeonSave(KEYS.COMING_SOON_ENABLED, enabled), requireNeonSave(KEYS.COMING_SOON_PRODUCTS, products)])
  },
  async load() { return { enabled: await getFromKV(KEYS.COMING_SOON_ENABLED), products: await getFromKV(KEYS.COMING_SOON_PRODUCTS) } },
}

export const productsSync = {
  async save(products: Product[]) {
    const catalog = products.length ? products : staticProducts
    localStorage.setItem(KEYS.ALL_PRODUCTS, JSON.stringify(catalog))
    await requireNeonSave(KEYS.ALL_PRODUCTS, catalog)
  },
  async load() {
    const value = await getFromKV(KEYS.ALL_PRODUCTS)
    if (Array.isArray(value) && value.length) return value as Product[]
    await requireNeonSave(KEYS.ALL_PRODUCTS, staticProducts)
    return staticProducts
  },
}

export const customProductsSync = {
  async save(products: Product[]) { localStorage.setItem(KEYS.CUSTOM_PRODUCTS, JSON.stringify(products)); await requireNeonSave(KEYS.CUSTOM_PRODUCTS, products) },
  async load() { return getFromKV(KEYS.CUSTOM_PRODUCTS) as Promise<Product[] | null> },
}

// Legacy names retained for source compatibility.
export const syncFromSupabase = syncFromNeon
export const syncToSupabase = syncToNeon
export const syncAllToSupabase = syncAllToNeon

// Keep open storefront tabs aligned with Neon without requiring a hard refresh.
// The interval is deliberately conservative to avoid excessive database/API traffic.
if (typeof window !== 'undefined') {
  const refresh = () => syncFromNeon().catch(error => console.error('Background Neon refresh failed:', error))
  window.setInterval(refresh, 30000)
  window.addEventListener('focus', refresh)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh() })
}

export { KEYS }
