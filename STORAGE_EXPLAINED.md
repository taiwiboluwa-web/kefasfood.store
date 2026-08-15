# Kefas Food Storage System

## Current storage architecture

Kefas Food now uses:

- **Neon PostgreSQL** for persistent admin/inventory data.
- **Vercel Blob** for product images.
- **Browser localStorage** only as a small emergency fallback for images up to 2MB.

## Product images

The admin upload flow sends product images to `/api/blob` on the deployed Vercel site. The Blob read/write token stays server-side and is never exposed to the browser.

Current server upload limit:

- Maximum image size: **4MB**
- Supported formats: JPEG, PNG, WebP, GIF, AVIF
- Blob access: **Public**, because product images are public storefront assets.

Vercel Blob provides globally served object storage and immutable URLs suitable for product images. The application uses the custom environment variable `KEFAS_READ_WRITE_TOKEN` because the Blob store was connected with the `KEFAS` prefix.

## Persistent admin data

The following application state is stored in the Neon `kv_store_da50176a` table through `/api/kv`:

- `kefas_stock_status`
- `kefas_product_prices`
- `kefas_variant_prices`
- `kefas_all_products`
- `kefas_coming_soon_enabled`
- `kefas_coming_soon_products`
- `kefas_custom_products`

The browser keeps a local copy for fast UI updates, while changes are persisted to Neon.

## Fallback behavior

If Blob upload fails, the existing localStorage fallback can temporarily keep small images (up to 2MB) in the current browser. This is only a safety net; it is not shared storage and should not be relied on for production images.

## Required Vercel environment variables

```text
DATABASE_URL
KEFAS_READ_WRITE_TOKEN
```

The Blob connection also creates its store ID and webhook public-key variables. Those values are managed by Vercel and do not need to be exposed in frontend code.

## Result

```text
Kefas Food
├── Vercel        → hosting
├── Neon          → database
├── Vercel Blob   → product images
└── Stripe        → payments
```

Supabase is no longer part of the application's runtime storage architecture.
