import { supabase } from './supabase';
import { Product } from '../app/data/products';

// Key names for Supabase KV store
const KEYS = {
  STOCK_STATUS: 'kefas_stock_status',
  PRODUCT_PRICES: 'kefas_product_prices',
  VARIANT_PRICES: 'kefas_variant_prices',
  ALL_PRODUCTS: 'kefas_all_products',
  COMING_SOON_ENABLED: 'kefas_coming_soon_enabled',
  COMING_SOON_PRODUCTS: 'kefas_coming_soon_products',
  CUSTOM_PRODUCTS: 'kefas_custom_products'
};

// Helper function to get data from Supabase KV store
async function getFromKV(key: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('kv_store_da50176a')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      // Silently fail - Supabase is optional
      return null;
    }

    return data?.value ?? null;
  } catch (err) {
    // Silently fail - network errors are expected when Supabase is unavailable
    return null;
  }
}

// Helper function to set data in Supabase KV store
async function setInKV(key: string, value: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('kv_store_da50176a')
      .upsert({ key, value });

    if (error) {
      // Silently fail - Supabase is optional
      return false;
    }

    return true;
  } catch (err) {
    // Silently fail - network errors are expected when Supabase is unavailable
    return false;
  }
}

// Sync data from Supabase to localStorage
export async function syncFromSupabase(): Promise<void> {
  try {
    console.log('📥 Downloading data from Supabase...');
    
    // Fetch all data from Supabase
    const [
      stockStatus,
      productPrices,
      variantPrices,
      allProducts,
      comingSoonEnabled,
      comingSoonProducts,
      customProducts
    ] = await Promise.all([
      getFromKV(KEYS.STOCK_STATUS),
      getFromKV(KEYS.PRODUCT_PRICES),
      getFromKV(KEYS.VARIANT_PRICES),
      getFromKV(KEYS.ALL_PRODUCTS),
      getFromKV(KEYS.COMING_SOON_ENABLED),
      getFromKV(KEYS.COMING_SOON_PRODUCTS),
      getFromKV(KEYS.CUSTOM_PRODUCTS)
    ]);

    // Update localStorage with Supabase data (if exists)
    if (stockStatus !== null) {
      localStorage.setItem(KEYS.STOCK_STATUS, JSON.stringify(stockStatus));
    }
    if (productPrices !== null) {
      localStorage.setItem(KEYS.PRODUCT_PRICES, JSON.stringify(productPrices));
    }
    if (variantPrices !== null) {
      localStorage.setItem(KEYS.VARIANT_PRICES, JSON.stringify(variantPrices));
    }
    if (allProducts !== null) {
      localStorage.setItem(KEYS.ALL_PRODUCTS, JSON.stringify(allProducts));
    }
    if (comingSoonEnabled !== null) {
      localStorage.setItem(KEYS.COMING_SOON_ENABLED, JSON.stringify(comingSoonEnabled));
    }
    if (comingSoonProducts !== null) {
      localStorage.setItem(KEYS.COMING_SOON_PRODUCTS, JSON.stringify(comingSoonProducts));
    }
    if (customProducts !== null) {
      localStorage.setItem(KEYS.CUSTOM_PRODUCTS, JSON.stringify(customProducts));
    }

    // Always log the result
    const syncedCount = [stockStatus, productPrices, variantPrices, allProducts, comingSoonEnabled, comingSoonProducts, customProducts].filter(v => v !== null).length;
    console.log(`✅ Downloaded ${syncedCount} items from Supabase`);
  } catch (err) {
    console.error('❌ Failed to download from Supabase:', err);
    // Don't throw - sync from Supabase is optional
  }
}

// Sync specific data item to Supabase
export async function syncToSupabase(key: string, value: any): Promise<boolean> {
  try {
    const success = await setInKV(key, value);
    // Silently succeed or fail
    return success;
  } catch (err) {
    // Silently fail - Supabase sync is optional
    return false;
  }
}

// Sync all localStorage data to Supabase
export async function syncAllToSupabase(): Promise<void> {
  try {
    console.log('📤 Uploading all data to Supabase...');
    const updates: Promise<boolean>[] = [];

    // Get all data from localStorage
    const stockStatus = localStorage.getItem(KEYS.STOCK_STATUS);
    const productPrices = localStorage.getItem(KEYS.PRODUCT_PRICES);
    const variantPrices = localStorage.getItem(KEYS.VARIANT_PRICES);
    const allProducts = localStorage.getItem(KEYS.ALL_PRODUCTS);
    const comingSoonEnabled = localStorage.getItem(KEYS.COMING_SOON_ENABLED);
    const comingSoonProducts = localStorage.getItem(KEYS.COMING_SOON_PRODUCTS);
    const customProducts = localStorage.getItem(KEYS.CUSTOM_PRODUCTS);

    // Queue updates
    if (stockStatus) updates.push(setInKV(KEYS.STOCK_STATUS, JSON.parse(stockStatus)));
    if (productPrices) updates.push(setInKV(KEYS.PRODUCT_PRICES, JSON.parse(productPrices)));
    if (variantPrices) updates.push(setInKV(KEYS.VARIANT_PRICES, JSON.parse(variantPrices)));
    if (allProducts) updates.push(setInKV(KEYS.ALL_PRODUCTS, JSON.parse(allProducts)));
    if (comingSoonEnabled) updates.push(setInKV(KEYS.COMING_SOON_ENABLED, JSON.parse(comingSoonEnabled)));
    if (comingSoonProducts) updates.push(setInKV(KEYS.COMING_SOON_PRODUCTS, JSON.parse(comingSoonProducts)));
    if (customProducts) updates.push(setInKV(KEYS.CUSTOM_PRODUCTS, JSON.parse(customProducts)));

    // Execute all updates
    const results = await Promise.all(updates);
    const successCount = results.filter(r => r).length;

    // Always log the result for manual syncs
    console.log(`✅ Synced ${successCount}/${updates.length} items to Supabase`);
    
    if (successCount === 0) {
      throw new Error('No items were synced to Supabase');
    }
  } catch (err) {
    console.error('❌ Failed to sync to Supabase:', err);
    throw err;
  }
}

// Specific helpers for different data types
export const stockStatusSync = {
  async save(stockStatus: Record<string, boolean>): Promise<boolean> {
    localStorage.setItem(KEYS.STOCK_STATUS, JSON.stringify(stockStatus));
    const success = await syncToSupabase(KEYS.STOCK_STATUS, stockStatus);
    if (success) {
      console.log('✅ Synced to Supabase: Stock status');
    }
    return success;
  },
  async load(): Promise<Record<string, boolean> | null> {
    return await getFromKV(KEYS.STOCK_STATUS);
  }
};

export const productPricesSync = {
  async save(prices: Record<string, number>, variantPrices: Record<string, Record<string, number>>): Promise<boolean> {
    localStorage.setItem(KEYS.PRODUCT_PRICES, JSON.stringify(prices));
    localStorage.setItem(KEYS.VARIANT_PRICES, JSON.stringify(variantPrices));
    const success1 = await syncToSupabase(KEYS.PRODUCT_PRICES, prices);
    const success2 = await syncToSupabase(KEYS.VARIANT_PRICES, variantPrices);
    if (success1 && success2) {
      console.log('✅ Synced to Supabase: Product prices');
    }
    return success1 && success2;
  },
  async load(): Promise<{ productPrices: Record<string, number> | null, variantPrices: Record<string, Record<string, number>> | null }> {
    const productPrices = await getFromKV(KEYS.PRODUCT_PRICES);
    const variantPrices = await getFromKV(KEYS.VARIANT_PRICES);
    return { productPrices, variantPrices };
  }
};

export const comingSoonSync = {
  async save(enabled: boolean, products: string[]): Promise<boolean> {
    localStorage.setItem(KEYS.COMING_SOON_ENABLED, JSON.stringify(enabled));
    localStorage.setItem(KEYS.COMING_SOON_PRODUCTS, JSON.stringify(products));
    const success1 = await syncToSupabase(KEYS.COMING_SOON_ENABLED, enabled);
    const success2 = await syncToSupabase(KEYS.COMING_SOON_PRODUCTS, products);
    if (success1 && success2) {
      console.log('✅ Synced to Supabase: Coming Soon settings');
    }
    return success1 && success2;
  },
  async load(): Promise<{ enabled: boolean | null, products: string[] | null }> {
    const enabled = await getFromKV(KEYS.COMING_SOON_ENABLED);
    const products = await getFromKV(KEYS.COMING_SOON_PRODUCTS);
    return { enabled, products };
  }
};

export const productsSync = {
  async save(products: Product[]): Promise<boolean> {
    localStorage.setItem(KEYS.ALL_PRODUCTS, JSON.stringify(products));
    const success = await syncToSupabase(KEYS.ALL_PRODUCTS, products);
    if (success) {
      console.log('✅ Synced to Supabase: Products list');
    }
    return success;
  },
  async load(): Promise<Product[] | null> {
    return await getFromKV(KEYS.ALL_PRODUCTS);
  }
};

export const customProductsSync = {
  async save(products: Product[]): Promise<boolean> {
    localStorage.setItem(KEYS.CUSTOM_PRODUCTS, JSON.stringify(products));
    return await syncToSupabase(KEYS.CUSTOM_PRODUCTS, products);
  },
  async load(): Promise<Product[] | null> {
    return await getFromKV(KEYS.CUSTOM_PRODUCTS);
  }
};

export { KEYS };
