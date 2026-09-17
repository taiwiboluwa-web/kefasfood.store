/**
 * Legacy-named storage diagnostic shim.
 * Product images use Vercel Blob. This module also mounts the media optimizer
 * control into the existing admin UI without changing the existing admin flow.
 */

async function optimizeBlobImage(url: string, productId: string): Promise<{ url: string; before: number; after: number } | null> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not download image (${response.status})`);

  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  try {
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const output = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.78));
    if (!output) throw new Error('WebP conversion failed');
    if (output.size >= blob.size * 0.9 && blob.size <= 500 * 1024) return null;

    const file = new File([output], `${productId}.webp`, { type: 'image/webp', lastModified: Date.now() });
    const form = new FormData();
    form.append('file', file);
    form.append('productId', productId);
    const uploadResponse = await fetch('/api/blob', { method: 'POST', body: form });
    const uploadData = await uploadResponse.json().catch(() => null);
    if (!uploadResponse.ok || typeof uploadData?.url !== 'string') {
      throw new Error(uploadData?.error || 'Optimized image upload failed');
    }

    return { url: uploadData.url, before: blob.size, after: output.size };
  } finally {
    bitmap.close();
  }
}

async function optimizeExistingProductImages(setStatus: (value: string) => void): Promise<void> {
  const productsResponse = await fetch('/api/kv?key=kefas_all_products', {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-store' },
  });
  const productsData = await productsResponse.json();
  if (!productsResponse.ok || !Array.isArray(productsData?.value)) throw new Error('Could not load the product catalog from Neon');

  const products = productsData.value;
  const updatedProducts = [...products];
  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let beforeBytes = 0;
  let afterBytes = 0;

  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    const imageUrl = typeof product?.imageUrl === 'string' ? product.imageUrl : '';
    if (!imageUrl.includes('.blob.vercel-storage.com/')) {
      skipped += 1;
      continue;
    }

    setStatus(`Optimizing ${index + 1} of ${products.length}: ${product.name}`);
    try {
      const optimized = await optimizeBlobImage(imageUrl, String(product.id));
      if (!optimized) {
        skipped += 1;
        continue;
      }

      updatedProducts[index] = { ...product, imageUrl: optimized.url };
      beforeBytes += optimized.before;
      afterBytes += optimized.after;
      processed += 1;

      // Remove the old Blob only after the replacement upload succeeds.
      await fetch('/api/blob', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: imageUrl }),
      });
    } catch (error) {
      failed += 1;
      console.error(`Image optimization failed for ${product?.name}:`, error);
    }
  }

  if (processed > 0) {
    const saveResponse = await fetch('/api/kv', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Cache-Control': 'no-store',
      },
      cache: 'no-store',
      body: JSON.stringify({ key: 'kefas_all_products', value: updatedProducts }),
    });
    const saveData = await saveResponse.json().catch(() => null);
    if (!saveResponse.ok || saveData?.ok !== true) throw new Error(saveData?.error || 'Neon catalog update failed');
    localStorage.setItem('kefas_all_products', JSON.stringify(updatedProducts));
    window.dispatchEvent(new CustomEvent('kefas_products_updated', { detail: updatedProducts }));
  }

  const savedKb = Math.max(0, (beforeBytes - afterBytes) / 1024);
  const percent = beforeBytes > 0 ? Math.round((1 - afterBytes / beforeBytes) * 100) : 0;
  setStatus(`Finished: ${processed} optimized, ${skipped} skipped, ${failed} failed. Saved ${savedKb.toFixed(0)}KB (${percent}%).`);
}

function mountImageOptimizerButton() {
  if (typeof window === 'undefined' || window.location.pathname !== '/admin') return;
  if (document.getElementById('kefas-image-optimizer')) return;

  const container = document.createElement('div');
  container.id = 'kefas-image-optimizer';
  container.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:9999;background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:12px;box-shadow:0 12px 35px rgba(0,0,0,.14);width:min(360px,calc(100vw - 40px));font-family:ui-sans-serif,system-ui,sans-serif';
  container.innerHTML = `
    <div style="font-weight:700;color:#18181b;font-size:14px;margin-bottom:4px">Website Images</div>
    <div style="color:#71717a;font-size:12px;line-height:1.45;margin-bottom:10px">Compress existing Vercel Blob product images and save the smaller versions back to Neon.</div>
    <button id="kefas-optimize-images" style="width:100%;border:0;border-radius:8px;background:#1DB854;color:white;padding:9px 12px;font-weight:600;cursor:pointer">Optimize Existing Images</button>
    <div id="kefas-optimize-status" style="color:#52525b;font-size:11px;line-height:1.4;margin-top:8px"></div>
  `;
  document.body.appendChild(container);

  const button = document.getElementById('kefas-optimize-images') as HTMLButtonElement | null;
  const status = document.getElementById('kefas-optimize-status');
  button?.addEventListener('click', async () => {
    if (!button || !status) return;
    button.disabled = true;
    button.style.opacity = '0.65';
    status.textContent = 'Starting...';
    try {
      await optimizeExistingProductImages(value => { status.textContent = value; });
    } catch (error: any) {
      status.textContent = error?.message || 'Image optimization failed.';
    } finally {
      button.disabled = false;
      button.style.opacity = '1';
    }
  });
}

export async function diagnoseStorageIssues(): Promise<boolean> {
  try {
    const response = await fetch('/api/blob?diagnostic=1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ diagnostic: true }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => null);
    if (response.ok && data?.ok === true) {
      console.info('Vercel Blob storage diagnostic passed.');
      return true;
    }
    console.error('Vercel Blob storage diagnostic failed:', data?.error || `HTTP ${response.status}`);
    return false;
  } catch (error) {
    console.error('Vercel Blob storage diagnostic request failed:', error);
    return false;
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountImageOptimizerButton, { once: true });
  else window.setTimeout(mountImageOptimizerButton, 0);
}
