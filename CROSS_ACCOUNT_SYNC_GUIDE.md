# Cross-Account Data Synchronization Guide

## Overview

Your Kefas Foods website now features **full cross-account data synchronization** using Supabase. This means:

- ✅ All product updates sync across all admin accounts instantly
- ✅ Stock status changes are visible everywhere
- ✅ Price changes update across all sessions
- ✅ Coming Soon products are synchronized
- ✅ Custom products are shared across all accounts
- ✅ Works across different browsers and devices

## How It Works

### Architecture

1. **Local Storage** - Provides fast, instant updates within a single browser session
2. **Supabase Database** - Central source of truth for all data across accounts
3. **Automatic Sync** - Data syncs bidirectionally between localStorage and Supabase

### Data Synchronized

All of the following data is automatically synced across accounts:

| Data Type | Description | Sync Trigger |
|-----------|-------------|--------------|
| **Stock Status** | Product availability (in stock / out of stock) | When you toggle stock in admin |
| **Product Prices** | Base prices and variant prices | When you update any price |
| **Product List** | All products including custom ones | When you add/delete/reorder products |
| **Coming Soon** | Products marked as "Coming Soon" | When you add/remove from Coming Soon |
| **Settings** | Coming Soon enabled/disabled state | When you toggle the feature |

## Featured Products

### Banga Spice
- **Product ID:** `10`
- **Category:** Spices & Flavors
- **Default Price:** £5.99 (250g)
- **Image:** ✅ Properly configured
- **Status:** Fully integrated in admin panel

### Dried Prawns
- **Product ID:** `32`
- **Category:** Meats & Protein
- **Default Price:** £12.99 (500g)
- **Image:** ✅ Properly configured
- **Status:** Fully integrated in admin panel

Both products are set as **Coming Soon by default** and can be easily managed from the admin panel.

## Admin Panel Features

### Accessing the Admin Panel

1. Navigate to `/admin` on your website
2. Enter admin password: `@kefas_bhs2026`
3. You'll see three main tabs:
   - **Visits** - Track website visitors
   - **Inventory** - Manage products, stock, and prices
   - **Coming Soon** - Configure featured coming soon products

### Managing Products

**Stock Management:**
- Toggle stock status for any product
- Changes sync immediately across all accounts

**Price Management:**
- Update base prices
- Update variant prices (different weights/sizes)
- All price changes sync across accounts

**Product Management:**
- Add new custom products
- Delete products
- Reorder products (move up/down)
- All changes sync automatically

**Coming Soon Section:**
- Enable/disable the Coming Soon feature
- Add products to Coming Soon
- Remove products from Coming Soon
- Reset to defaults (Banga Spice & Dried Prawns)

## How to Ensure Data Syncs

### When You Update Something in Admin:

1. **Make your change** (e.g., toggle stock, update price)
2. **Wait 1-2 seconds** for Supabase sync to complete
3. **Open another browser/device** to verify the change

### Troubleshooting Sync Issues:

If data doesn't sync:
1. Check your internet connection
2. Refresh the admin page (it will pull latest data from Supabase)
3. Check browser console for any errors
4. Verify Supabase is accessible

## Technical Details

### Supabase Configuration

- **Project ID:** `dcqubxvsouyccukbgxzr`
- **Table:** `kv_store_da50176a`
- **Schema:** Key-value store for flexible data storage

### Key Storage Keys

All data is stored with these keys:
```
kefas_stock_status         - Product stock availability
kefas_product_prices       - Base product prices
kefas_variant_prices       - Variant (size) prices
kefas_all_products         - Complete product list
kefas_coming_soon_enabled  - Coming Soon feature toggle
kefas_coming_soon_products - Coming Soon product IDs
```

### Sync Functions

The following functions handle synchronization:

- `syncFromSupabase()` - Loads all data from Supabase to localStorage
- `syncToSupabase(key, value)` - Saves specific data to Supabase
- `stockStatusSync.save()` - Syncs stock status
- `productPricesSync.save()` - Syncs all prices
- `comingSoonSync.save()` - Syncs Coming Soon settings
- `productsSync.save()` - Syncs product list

## Best Practices

### For Admin Users:

1. **Always verify changes** - Check another device/browser after important updates
2. **Use meaningful product names** - Makes management easier
3. **Set proper prices** - Include all variants for products with multiple sizes
4. **Manage Coming Soon wisely** - Only feature 2-4 products maximum
5. **Test before going live** - Verify all changes on main site before announcing

### For Developers:

1. **Never bypass sync functions** - Always use the provided sync utilities
2. **Handle errors gracefully** - Sync failures should revert to previous state
3. **Monitor Supabase usage** - Check database usage in Supabase dashboard
4. **Keep localStorage and Supabase in sync** - Always sync after localStorage updates

## Default Configuration

### Default Coming Soon Products:

By default, the following products are featured in Coming Soon:
1. **Banga Spice** (Product ID: 10)
2. **Dried Prawns** (Product ID: 32)

You can reset to these defaults anytime using the "Reset to Defaults" button in the Coming Soon admin tab.

### Default Product Configuration:

Both default Coming Soon products have:
- ✅ Proper product images
- ✅ Multiple size variants
- ✅ Detailed descriptions
- ✅ Appropriate categories
- ✅ Popular/New badges

## Security Notes

- Admin password is required to access admin panel
- Password is stored in session storage (cleared on browser close)
- Supabase uses Row Level Security (if configured)
- All sync operations are logged to browser console for debugging

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify Supabase connection at https://supabase.com/dashboard/project/dcqubxvsouyccukbgxzr
3. Review this guide for troubleshooting tips
4. Contact technical support if issues persist

---

**Last Updated:** April 4, 2026
**Version:** 1.0.0
