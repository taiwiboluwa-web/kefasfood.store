// App version - increment this to force cache refresh
export const APP_VERSION = '1.7.0';
export const CACHE_KEY = `kefas_cache_v${APP_VERSION}`;

// Check and clear old cache versions
export function clearOldCache() {
  const currentVersion = localStorage.getItem('kefas_app_version');

  if (currentVersion !== APP_VERSION) {
    console.log(`🔄 Updating from v${currentVersion || 'unknown'} to v${APP_VERSION}`);

    // IMPORTANT: Keep all product data and user data - only clear temporary cache
    const keysToKeep = [
      'kefasFood_cart',
      'kefas_stock_status',
      'kefas_product_prices',
      'kefas_variant_prices',
      'kefas_all_products',
      'kefas_coming_soon_enabled',
      'kefas_coming_soon_products',
      'kefas_custom_products',
      'kefas_local_visits',
      'kefas_admin_theme'
    ];

    const allKeys = Object.keys(localStorage);

    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    localStorage.setItem('kefas_app_version', APP_VERSION);
    console.log('✅ Cache updated to', APP_VERSION);

    // Don't force reload - let the app continue normally
  }
}
