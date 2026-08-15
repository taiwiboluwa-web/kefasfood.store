import { Product } from '../app/data/products';
import { supabase } from './supabase';

// Keys used by the Kefas admin/inventory sync layer.
const KEYS = {
  STOCK_STATUS: 'kefas_stock_status',
  PRODUCT_PRICES: 'kefas_product_prices',
  VARIANT_PRICES: 'kefas_variant_prices',
  ALL_PRODUCTS: 'kefas_all_products',
  COMING_SOON_ENABLED: 'kefas_coming_soon_enabled',
  COMING_SOON_PRODUCTS: 'kefas_coming_soon_products',
  CUSTOM_PRODUCTS: 'kefas_custom_products',
} as const;

type KVKey = (typeof KEYS)[keyof typeof KEYS];

async function getFromNeon(key: KVKey): Promise<any | null> {
  try {
    const response = await fetch(`/api/kv?key=${encodeURIComponent(key)}`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.value ?? null;
  } catch (error) {
    console.error(`❌ Failed to load Neon KV key ${key}:`, error);
    return null;
  }
}

async function getFromSupabaseForMigration(key: KVKey): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('kv_store_da50176a')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error || data?.value === undefined) return null;

    return data.value;
  } catch (error) {
    console.error(`❌ Legacy Supabase migration read failed for ${key}:`, error);
    return null;
  }
}

async function getFromKV(key: KVKey): Promise<any | null> {
  const neonValue = await getFromNeon(key);
  if (neonValue !== null) return neonValue;

  // One-time migration fallback: if Neon is empty, recover the existing value
  // from Supabase and immediately copy it into Neon. Supabase is never written to.
  const legacyValue = await getFromSupabaseForMigration(key);
  if (legacyValue !== null) {
    const migrated = await setInKV(key, legacyValue);
    if (migrated) {
      console.log(`✅ Migrated legacy Kefas key to Neon: ${key}`);
    }
    return legacyValue;
  }

  return null;
}

async function setInKV(key: KVKey, value: any): Promise<boolean> {
  try {
    const response = await fetch('/api/kv', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });

    if (!response.ok) {
      console.error(`❌ Failed to save Neon KV key ${key}:`, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to save Neon KV key ${key}:`, error);
    return false;
  }
}

export async function syncFromNeon(): Promise<void> {
  try {
    console.log('📥 Downloading Kefas data from Neon (with legacy migration fallback)...');

    const [
      stockStatus,
      productPrices,
      variantPrices,
      allProducts,
      comingSoonEnabled,
      comingSoonProducts,
      customProducts,
    ] = await Promise.all([
      getFromKV(KEYS.STOCK_STATUS),
      getFromKV(KEYS.PRODUCT_PRICES),
      getFromKV(KEYS.VARIANT_PRICES),
      getFromKV(KEYS.ALL_PRODUCTS),
      getFromKV(KEYS.COMING_SOON_ENABLED),
      getFromKV(KEYS.COMING_SOON_PRODUCTS),
      getFromKV(KEYS.CUSTOM_PRODUCTS),
    ]);

    if (stockStatus !== null) localStorage.setItem(KEYS.STOCK_STATUS, JSON.stringify(stockStatus));
    if (productPrices !== null) localStorage.setItem(KEYS.PRODUCT_PRICES, JSON.stringify(productPrices));
    if (variantPrices !== null) localStorage.setItem(KEYS.VARIANT_PRICES, JSON.stringify(variantPrices));
    if (allProducts !== null) localStorage.setItem(KEYS.ALL_PRODUCTS, JSON.stringify(allProducts));
    if (comingSoonEnabled !== null) localStorage.setItem(KEYS.COMING_SOON_ENABLED, JSON.stringify(comingSoonEnabled));
    if (comingSoonProducts !== null) localStorage.setItem(KEYS.COMING_SOON_PRODUCTS, JSON.stringify(comingSoonProducts));
    if (customProducts !== null) localStorage.setItem(KEYS.CUSTOM_PRODUCTS, JSON.stringify(customProducts));

    const syncedCount = [
      stockStatus,
      productPrices,
      variantPrices,
      allProducts,
      comingSoonEnabled,
      comingSoonProducts,
      customProducts,
    ].filter((value) => value !== null).length;

    console.log(`✅ Downloaded ${syncedCount} items from Neon/legacy migration`);
  } catch (error) {
    console.error('❌ Failed to download Kefas data:', error);
  }
}

export async function syncToNeon(key: KVKey, value: any): Promise<boolean> {
  return setInKV(key, value);
}

export async function syncAllToNeon(): Promise<void> {
  const entries: Array<[KVKey, string | null]> = [
    [KEYS.STOCK_STATUS, localStorage.getItem(KEYS.STOCK_STATUS)],
    [KEYS.PRODUCT_PRICES, localStorage.getItem(KEYS.PRODUCT_PRICES)],
    [KEYS.VARIANT_PRICES, localStorage.getItem(KEYS.VARIANT_PRICES)],
    [KEYS.ALL_PRODUCTS, localStorage.getItem(KEYS.ALL_PRODUCTS)],
    [KEYS.COMING_SOON_ENABLED, localStorage.getItem(KEYS.COMING_SOON_ENABLED)],
    [KEYS.COMING_SOON_PRODUCTS, localStorage.getItem(KEYS.COMING_SOON_PRODUCTS)],
    [KEYS.CUSTOM_PRODUCTS, localStorage.getItem(KEYS.CUSTOM_PRODUCTS)],
  ];

  const updates = entries
    .filter(([, rawValue]) => rawValue !== null)
    .map(async ([key, rawValue]) => {
      try {
        return await setInKV(key, JSON.parse(rawValue as string));
      } catch {
        return false;
      }
    });

  const results = await Promise.all(updates);
  const successCount = results.filter(Boolean).length;

  console.log(`✅ Synced ${successCount}/${updates.length} items to Neon`);

  if (updates.length > 0 && successCount === 0) {
    throw new Error('No items were synced to Neon');
  }
}

export const stockStatusSync = {
  async save(stockStatus: Record<string, boolean>): Promise<boolean> {
    localStorage.setItem(KEYS.STOCK_STATUS, JSON.stringify(stockStatus));
    return syncToNeon(KEYS.STOCK_STATUS, stockStatus);
  },
  async load(): Promise<Record<string, boolean> | null> {
    return getFromKV(KEYS.STOCK_STATUS);
  },
};

export const productPricesSync = {
  async save(
    prices: Record<string, number>,
    variantPrices: Record<string, Record<string, number>>,
  ): Promise<boolean> {
    localStorage.setItem(KEYS.PRODUCT_PRICES, JSON.stringify(prices));
    localStorage.setItem(KEYS.VARIANT_PRICES, JSON.stringify(variantPrices));

    const [success1, success2] = await Promise.all([
      syncToNeon(KEYS.PRODUCT_PRICES, prices),
      syncToNeon(KEYS.VARIANT_PRICES, variantPrices),
    ]);

    return success1 && success2;
  },
  async load(): Promise<{
    productPrices: Record<string, number> | null;
    variantPrices: Record<string, Record<string, number>> | null;
  }> {
    const [productPrices, variantPrices] = await Promise.all([
      getFromKV(KEYS.PRODUCT_PRICES),
      getFromKV(KEYS.VARIANT_PRICES),
    ]);

    return { productPrices, variantPrices };
  },
};

export const comingSoonSync = {
  async save(enabled: boolean, products: string[]): Promise<boolean> {
    localStorage.setItem(KEYS.COMING_SOON_ENABLED, JSON.stringify(enabled));
    localStorage.setItem(KEYS.COMING_SOON_PRODUCTS, JSON.stringify(products));

    const [success1, success2] = await Promise.all([
      syncToNeon(KEYS.COMING_SOON_ENABLED, enabled),
      syncToNeon(KEYS.COMING_SOON_PRODUCTS, products),
    ]);

    return success1 && success2;
  },
  async load(): Promise<{ enabled: boolean | null; products: string[] | null }> {
    const [enabled, products] = await Promise.all([
      getFromKV(KEYS.COMING_SOON_ENABLED),
      getFromKV(KEYS.COMING_SOON_PRODUCTS),
    ]);

    return { enabled, products };
  },
};

export const productsSync = {
  async save(products: Product[]): Promise<boolean> {
    localStorage.setItem(KEYS.ALL_PRODUCTS, JSON.stringify(products));
    return syncToNeon(KEYS.ALL_PRODUCTS, products);
  },
  async load(): Promise<Product[] | null> {
    return getFromKV(KEYS.ALL_PRODUCTS);
  },
};

export const customProductsSync = {
  async save(products: Product[]): Promise<boolean> {
    localStorage.setItem(KEYS.CUSTOM_PRODUCTS, JSON.stringify(products));
    return syncToNeon(KEYS.CUSTOM_PRODUCTS, products);
  },
  async load(): Promise<Product[] | null> {
    return getFromKV(KEYS.CUSTOM_PRODUCTS);
  },
};

// Backward-compatible exports for existing admin imports while the codebase is migrated.
export const syncFromSupabase = syncFromNeon;
export const syncToSupabase = syncToNeon;
export const syncAllToSupabase = syncAllToNeon;

export { KEYS };
