# Connect Supabase - Step by Step Guide

## What You Need:

Your Supabase project is already configured with these credentials:
- **Project ID:** `slvyngbddtplgeiyurnq`
- **Project URL:** `https://slvyngbddtplgeiyurnq.supabase.co`

---

## Step 1: Access Supabase Dashboard

Go to: **https://supabase.com/dashboard/project/slvyngbddtplgeiyurnq**

(You may need to log in to Supabase first)

---

## Step 2: Enable Row Level Security (RLS) Policies

### For the KV Store Table:

1. In Supabase Dashboard, click **"Table Editor"** in the left menu
2. Find the table: **`kv_store_da50176a`**
3. Click on the table name
4. Click the **"RLS"** or **"Policies"** tab at the top
5. You'll see "Row Level Security" - it might say "Disabled" or "Enabled"

### Add These Two Policies:

#### Policy 1: Allow Public Read
1. Click **"New Policy"**
2. Choose **"For full customization"**
3. Fill in:
   - **Policy name:** `Allow public read access`
   - **Allowed operation:** SELECT
   - **Target roles:** Check "public" (or "anon")
   - **USING expression:** `true`
   - **WITH CHECK expression:** Leave blank
4. Click **"Review"** then **"Save policy"**

#### Policy 2: Allow Public Write
1. Click **"New Policy"** again
2. Choose **"For full customization"**
3. Fill in:
   - **Policy name:** `Allow public write access`
   - **Allowed operation:** INSERT, UPDATE
   - **Target roles:** Check "public" (or "anon")
   - **USING expression:** `true`
   - **WITH CHECK expression:** `true`
4. Click **"Review"** then **"Save policy"**

---

## Step 3: Enable Storage Bucket (For Images)

1. In Supabase Dashboard, click **"Storage"** in the left menu
2. Look for bucket: **`make-da50176a-product-images`**

### If bucket exists:
1. Click the bucket name
2. Click **"Policies"** tab
3. Add two policies (similar to above):
   - **Policy 1:** Allow public SELECT (read)
   - **Policy 2:** Allow public INSERT (upload)

### If bucket doesn't exist:
1. Click **"New bucket"**
2. Name: `make-da50176a-product-images`
3. Toggle **"Public bucket"** to **ON**
4. Set **File size limit:** 10 MB
5. Click **"Create bucket"**

---

## Step 4: Test the Connection

1. Go to your live website: https://www.kefasfood.store/
2. Open **Admin Panel** (Backrooms)
3. Press **F12** → Console tab
4. Click the **"Test Storage"** button in the header
5. You should see:
   ```
   ✅ Supabase connection working
   ✅ Bucket exists
   ✅ Upload test successful
   🎉 === ALL TESTS PASSED ===
   ```

---

## Step 5: Test Admin Changes Sync

1. In Admin Panel, change a product price
2. Console should show: **`✅ Synced to Supabase`**
3. Open the site in another browser/incognito
4. The price change should appear there too!

---

## Troubleshooting:

### "Permission denied" or "Policy violation"
→ Make sure you added BOTH read and write policies with `true` expressions

### "Bucket not found"
→ Create the bucket as shown in Step 3

### "RLS is enabled but no policies exist"
→ Add the two policies from Step 2

### Still not working?
→ Copy the console error messages and share them with me

---

## Quick Video Guide (If Needed):

If you're stuck, here's what the Supabase dashboard looks like:

1. **Table Editor** → Lists all your tables
2. **Policies** tab → Where you add RLS policies
3. **Storage** → Where you manage image buckets

---

## Alternative: Temporary Disable RLS (Quick Fix)

If you want to test quickly without setting up policies:

1. Go to **Table Editor**
2. Click **`kv_store_da50176a`**
3. Click **"RLS"** toggle to **disable it**
4. **WARNING:** This makes your data public - only for testing!

(You should add proper policies later for security)

---

## After Supabase is Connected:

✅ Admin changes sync to cloud automatically
✅ All users see your updates within 15 seconds
✅ Image uploads work
✅ Changes persist across browsers

---

**Start with Step 1 and let me know if you get stuck at any step!**
