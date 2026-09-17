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

const LAST_KNOWN_GOOD_PRODUCTS = 'kefas_last_known_good_products'
const LAST_KNOWN_GOOD_PRICES = 'kefas_last_known_good_prices'
const LAST_KNOWN_GOOD_VARIANT_PRICES = 'kefas_last_known_good_variant_prices'

type KVKey = (typeof KEYS)[keyof typeof KEYS]

async function getFromKV(key: KVKey): Promise<any | null> {
  try {
    const cacheBust = Date.now().toString()
    const response = await fetch(`/api/kv?key=${encodeURIComponent(key)}&cacheBust=${cacheBust}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'cache-control': 'no-cache',
        pragma: 'no-cache',
      },
    })
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
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
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
  if (key === KEYS.ALL_PRODUCTS && (!Array.isArray(value) || value.length === 0)) return
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

function readJsonObject<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function readLastKnownGoodCatalog(): Product[] | null {
  if (typeof window === 'undefined') return null
  try {
    const snapshot = localStorage.getItem(LAST_KNOWN_GOOD_PRODUCTS) || localStorage.getItem(KEYS.ALL_PRODUCTS)
    if (!snapshot) return null
    const parsed = JSON.parse(snapshot)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch (error) {
    console.error('Failed to read last-known-good catalog:', error)
    return null
  }
}

function readLastKnownGoodPrices(): Record<string, number> | null {
  return readJsonObject<Record<string, number>>(LAST_KNOWN_GOOD_PRICES) || readJsonObject<Record<string, number>>(KEYS.PRODUCT_PRICES)
}

function readLastKnownGoodVariantPrices(): Record<string, Record<string, number>> | null {
  return readJsonObject<Record<string, Record<string, number>>>(LAST_KNOWN_GOOD_VARIANT_PRICES) || readJsonObject<Record<string, Record<string, number>>>(KEYS.VARIANT_PRICES)
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

  // NEVER allow a transient network/API/Neon failure to erase a working catalog.
  if (!Array.isArray(allProducts) || allProducts.length === 0) {
    const lastKnownGood = readLastKnownGoodCatalog()
    if (lastKnownGood) {
      localStorage.setItem(KEYS.ALL_PRODUCTS, JSON.stringify(lastKnownGood))
      localStorage.setItem(LAST_KNOWN_GOOD_PRODUCTS, JSON.stringify(lastKnownGood))
      publishNeonUpdate(KEYS.ALL_PRODUCTS, lastKnownGood)
    }
    console.warn('Neon catalog response was empty/unavailable; preserving last-known-good product catalog')
    return
  }

  const catalog: Product[] = allProducts
  const savedPrices = readLastKnownGoodPrices()
  const savedVariantPrices = readLastKnownGoodVariantPrices()
  const resolvedStock = stockStatus ?? initialStock(catalog)
  const resolvedPrices = productPrices ?? savedPrices ?? initialPrices(catalog)
  const resolvedVariantPrices = variantPrices ?? savedVariantPrices ?? initialVariantPrices(catalog)
  const resolvedComingSoonEnabled = comingSoonEnabled ?? false
  const resolvedComingSoonProducts = Array.isArray(comingSoonProducts) ? comingSoonProducts : (readJsonObject<string[]>(KEYS.COMING_SOON_PRODUCTS) || [])
  const resolvedCustomProducts = Array.isArray(customProducts) ? customProducts : (readJsonObject<Product[]>(KEYS.CUSTOM_PRODUCTS) || [])

  const writes: Promise<void>[] = []
  if (stockStatus === null) writes.push(requireNeonSave(KEYS.STOCK_STATUS, resolvedStock))
  if (productPrices === null) writes.push(requireNeonSave(KEYS.PRODUCT_PRICES, resolvedPrices))
  if (variantPrices === null) writes.push(requireNeonSave(KEYS.VARIANT_PRICES, resolvedVariantPrices))
  if (comingSoonEnabled === null) writes.push(requireNeonSave(KEYS.COMING_SOON_ENABLED, false))
  if (comingSoonProducts === null) writes.push(requireNeonSave(KEYS.COMING_SOON_PRODUCTS, resolvedComingSoonProducts))
  if (customProducts === null) writes.push(requireNeonSave(KEYS.CUSTOM_PRODUCTS, resolvedCustomProducts))

  // Only a verified non-empty Neon catalog becomes the active local state.
  localStorage.setItem(KEYS.ALL_PRODUCTS, JSON.stringify(catalog))
  localStorage.setItem(LAST_KNOWN_GOOD_PRODUCTS, JSON.stringify(catalog))
  localStorage.setItem(KEYS.STOCK_STATUS, JSON.stringify(resolvedStock))
  localStorage.setItem(KEYS.PRODUCT_PRICES, JSON.stringify(resolvedPrices))
  localStorage.setItem(LAST_KNOWN_GOOD_PRICES, JSON.stringify(resolvedPrices))
  localStorage.setItem(KEYS.VARIANT_PRICES, JSON.stringify(resolvedVariantPrices))
  localStorage.setItem(LAST_KNOWN_GOOD_VARIANT_PRICES, JSON.stringify(resolvedVariantPrices))
  localStorage.setItem(KEYS.COMING_SOON_ENABLED, JSON.stringify(resolvedComingSoonEnabled))
  localStorage.setItem(KEYS.COMING_SOON_PRODUCTS, JSON.stringify(resolvedComingSoonProducts))
  localStorage.setItem(KEYS.CUSTOM_PRODUCTS, JSON.stringify(resolvedCustomProducts))

  const localValues: Array<[KVKey, unknown]> = [
    [KEYS.STOCK_STATUS, resolvedStock],
    [KEYS.PRODUCT_PRICES, resolvedPrices],
    [KEYS.VARIANT_PRICES, resolvedVariantPrices],
    [KEYS.ALL_PRODUCTS, catalog],
    [KEYS.COMING_SOON_ENABLED, resolvedComingSoonEnabled],
    [KEYS.COMING_SOON_PRODUCTS, resolvedComingSoonProducts],
    [KEYS.CUSTOM_PRODUCTS, resolvedCustomProducts],
  ]
  localValues.forEach(([key, value]) => publishNeonUpdate(key, value))

  if (writes.length) {
    const results = await Promise.allSettled(writes)
    results.forEach((result, index) => {
      if (result.status === 'rejected') console.error('Neon bootstrap write failed:', result.reason, writes[index])
    })
  }
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
  async save(value: Record<string, boolean>) {
    // Neon first. Do not report/save a local success before persistence is verified.
    await requireNeonSave(KEYS.STOCK_STATUS, value)
    localStorage.setItem(KEYS.STOCK_STATUS, JSON.stringify(value))
  },
  async load() { return getFromKV(KEYS.STOCK_STATUS) as Promise<Record<string, boolean> | null> },
}

export const productPricesSync = {
  async save(prices: Record<string, number>, variantPrices: Record<string, Record<string, number>>) {
    // Persist to Neon first. If either verified write fails, throw and do not
    // leave the browser with a value that was never successfully persisted.
    await requireNeonSave(KEYS.PRODUCT_PRICES, prices)
    await requireNeonSave(KEYS.VARIANT_PRICES, variantPrices)
    localStorage.setItem(KEYS.PRODUCT_PRICES, JSON.stringify(prices))
    localStorage.setItem(LAST_KNOWN_GOOD_PRICES, JSON.stringify(prices))
    localStorage.setItem(KEYS.VARIANT_PRICES, JSON.stringify(variantPrices))
    localStorage.setItem(LAST_KNOWN_GOOD_VARIANT_PRICES, JSON.stringify(variantPrices))
  },
  async load() {
    const [productPrices, variantPrices] = await Promise.all([getFromKV(KEYS.PRODUCT_PRICES), getFromKV(KEYS.VARIANT_PRICES)])
    return { productPrices: productPrices ?? readLastKnownGoodPrices(), variantPrices: variantPrices ?? readLastKnownGoodVariantPrices() }
  },
}

export const comingSoonSync = {
  async save(enabled: boolean, products: string[]) {
    await requireNeonSave(KEYS.COMING_SOON_ENABLED, enabled)
    await requireNeonSave(KEYS.COMING_SOON_PRODUCTS, products)
    localStorage.setItem(KEYS.COMING_SOON_ENABLED, JSON.stringify(enabled))
    localStorage.setItem(KEYS.COMING_SOON_PRODUCTS, JSON.stringify(products))
  },
  async load() { return { enabled: await getFromKV(KEYS.COMING_SOON_ENABLED), products: await getFromKV(KEYS.COMING_SOON_PRODUCTS) } },
}

export const productsSync = {
  async save(products: Product[]) {
    if (!Array.isArray(products) || products.length === 0) throw new Error('Refusing to save an empty product catalog')
    const catalog = products
    await requireNeonSave(KEYS.ALL_PRODUCTS, catalog)
    localStorage.setItem(KEYS.ALL_PRODUCTS, JSON.stringify(catalog))
    localStorage.setItem(LAST_KNOWN_GOOD_PRODUCTS, JSON.stringify(catalog))
  },
  async load() {
    const value = await getFromKV(KEYS.ALL_PRODUCTS)
    if (Array.isArray(value) && value.length) return value as Product[]
    return readLastKnownGoodCatalog() || staticProducts
  },
}

export const customProductsSync = {
  async save(products: Product[]) {
    await requireNeonSave(KEYS.CUSTOM_PRODUCTS, products)
    localStorage.setItem(KEYS.CUSTOM_PRODUCTS, JSON.stringify(products))
  },
  async load() { return getFromKV(KEYS.CUSTOM_PRODUCTS) as Promise<Product[] | null> },
}

export const syncFromSupabase = syncFromNeon
export const syncToSupabase = syncToNeon
export const syncAllToSupabase = syncAllToNeon

// Do not poll Neon every 30 seconds. A transient background request was able
// to mutate the visible catalog long after initial load. Keep the loaded state
// stable; an explicit reload/focus refresh can still reconcile with Neon.
if (typeof window !== 'undefined') {
  const refresh = () => syncFromNeon().catch(error => console.error('Neon refresh failed:', error))
  window.addEventListener('focus', refresh)
}

export { KEYS }
