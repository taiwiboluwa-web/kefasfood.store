# How to Fix "Storage bucket not ready" Error

When you see this error, it means Supabase Storage needs to be configured. Follow these steps:

## Automatic Diagnostics

The app now runs automatic diagnostics when you open the Admin Panel (Backrooms). 

**To see the diagnostic results:**
1. Open the Admin Panel (Backrooms)
2. Press F12 to open Developer Tools
3. Click the "Console" tab
4. Look for messages starting with 🔍 and follow the instructions

## Manual Fix - Option 1: Make Bucket Public (Easiest)

1. Go to: https://supabase.com/dashboard/project/slvyngbddtplgeiyurnq/storage/buckets
2. Find the bucket named: `make-da50176a-product-images`
3. Click the settings/gear icon next to the bucket name
4. Toggle **"Public bucket"** to **ON**
5. Click Save
6. Refresh your app and try uploading again

## Manual Fix - Option 2: Add RLS Policy

If the bucket exists but uploads fail:

1. Go to: https://supabase.com/dashboard/project/slvyngbddtplgeiyurnq/storage/buckets
2. Click on the bucket: `make-da50176a-product-images`
3. Click the **"Policies"** tab
4. Click **"New Policy"**
5. Select **"For full customization"**
6. Fill in:
   - **Policy name:** Public Upload Access
   - **Allowed operation:** INSERT
   - **Target roles:** Check "public" (or "anon")
   - **USING expression:** `true`
   - **WITH CHECK expression:** `true`
7. Click **"Review"** then **"Save policy"**
8. Repeat steps 4-7 but select **SELECT** for "Allowed operation" (so images can be read)

## Manual Fix - Option 3: Create Bucket (If it doesn't exist)

If the bucket doesn't exist yet:

1. Go to: https://supabase.com/dashboard/project/slvyngbddtplgeiyurnq/storage/buckets
2. Click **"New Bucket"**
3. Fill in:
   - **Name:** `make-da50176a-product-images`
   - **Public bucket:** Toggle **ON**
   - **File size limit:** 10 MB
4. Click **"Create bucket"**
5. Refresh your app and try uploading again

## Verify It's Working

After applying the fix:

1. Refresh your app
2. Open Admin Panel (Backrooms)
3. Press F12 → Console tab
4. Look for: `✅ Supabase Storage is ready to use!`
5. Try uploading a product image

## Automatic Fallback (No Setup Required!)

Good news! You don't need to fix Supabase Storage for most images:

✅ **Images under 4MB automatically save to localStorage**
- No Supabase setup needed
- Works 100% offline
- Instant uploads
- Most product images are under 4MB

For images **over 4MB**, use the **"📎 Image URL"** tab:
- Upload to [Imgur](https://imgur.com) (free, unlimited)
- Upload to [ImgBB](https://imgbb.com) (free, unlimited)
- Paste the image URL into the app

## Need Help?

Open the browser console (F12 → Console) and share any error messages you see. The diagnostic tool will tell you exactly what's wrong.
