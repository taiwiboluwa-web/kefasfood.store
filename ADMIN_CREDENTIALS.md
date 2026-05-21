# Admin Access Credentials

## Admin Panel Access

**URL:** `/admin`

**Password:** `@kefas_bhs2026`

---

## Supabase Database Access

**Project URL:** https://supabase.com/dashboard/project/dcqubxvsouyccukbgxzr

**Project ID:** `dcqubxvsouyccukbgxzr`

**Database Table:** `kv_store_da50176a`

---

## Important Product IDs

### Coming Soon Default Products:

1. **Banga Spice**
   - Product ID: `10`
   - Category: Spices & Flavors
   - Default Price: £5.99 (250g)
   - Variants: 250g (£5.99), 500g (£10.99)

2. **Dried Prawns**
   - Product ID: `32`
   - Category: Meats & Protein
   - Default Price: £12.99 (500g)
   - Variants: 250g (£7.99), 500g (£12.99), 1kg (£24.99)

---

## Admin Capabilities

### All Admin Accounts Can:

✅ View website visitor analytics
✅ Manage product inventory (stock status)
✅ Update product prices (base + variants)
✅ Add new custom products
✅ Delete products
✅ Reorder products
✅ Manage "Coming Soon" section
✅ All changes sync across all admin accounts automatically

---

## Quick Start Guide

1. **Access Admin Panel**
   - Go to your website URL + `/admin`
   - Enter password: `@kefas_bhs2026`

2. **Update Stock**
   - Go to "Inventory" tab
   - Toggle any product's stock status
   - Changes sync automatically

3. **Update Prices**
   - In "Inventory" tab, find the product
   - Click on the price field to edit
   - Press Enter to save
   - Changes sync automatically

4. **Manage Coming Soon**
   - Go to "Coming Soon" tab
   - Add or remove products
   - Reset to defaults (Banga Spice & Dried Prawns)

5. **Verify Sync**
   - Open admin panel in another browser/device
   - Check that changes appear there too

---

## Data Sync Status

All data is automatically synchronized to Supabase database:

- ✅ Product stock status
- ✅ Product prices (base + variants)
- ✅ Complete product list
- ✅ Coming Soon products
- ✅ Custom added products

**Sync happens instantly** when you make changes in the admin panel.

---

## Security Notes

- Keep admin password secure
- Only share with trusted team members
- Admin session expires when browser is closed
- All admin actions are logged (check browser console)

---

**Need Help?**

See `CROSS_ACCOUNT_SYNC_GUIDE.md` for detailed documentation.

---

**Last Updated:** April 4, 2026
