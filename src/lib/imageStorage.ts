import { storeImageLocally } from './imageStorageFallback';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const LOCAL_STORAGE_FALLBACK_SIZE = 2 * 1024 * 1024;

/**
 * Upload a product image through the Vercel Blob server endpoint.
 * The Blob token stays server-side and is never exposed to the browser.
 */
export async function uploadProductImage(file: File, productId: string): Promise<string | null> {
  try {
    if (file.size > MAX_FILE_SIZE) {
      console.error('❌ File too large. Maximum size is 10MB per image.');
      return null;
    }

    const form = new FormData();
    form.append('file', file);
    form.append('productId', productId);

    const response = await fetch('/api/blob', {
      method: 'POST',
      body: form,
    });

    if (response.ok) {
      const data = await response.json();
      if (typeof data?.url === 'string') {
        console.log(`✅ Image uploaded to Vercel Blob: ${data.url}`);
        return data.url;
      }
    }

    console.error('❌ Vercel Blob upload failed:', await response.text());
  } catch (error) {
    console.error('❌ Unexpected Vercel Blob upload error:', error);
  }

  // Keep the existing small-image local fallback so the admin UI remains usable
  // while Blob is being configured in Vercel.
  if (file.size <= LOCAL_STORAGE_FALLBACK_SIZE) {
    try {
      const localUrl = await storeImageLocally(file, productId);
      if (localUrl) {
        console.warn('⚠️ Using localStorage image fallback.');
        return localUrl;
      }
    } catch (error) {
      console.error('❌ Local image fallback failed:', error);
    }
  }

  return null;
}

/** Delete a product image previously stored in Vercel Blob. */
export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  try {
    if (!imageUrl.includes('.blob.vercel-storage.com/')) {
      console.warn('Skipping deletion for non-Vercel-Blob image URL.');
      return false;
    }

    const response = await fetch('/api/blob', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: imageUrl }),
    });

    if (!response.ok) {
      console.error('❌ Vercel Blob deletion failed:', await response.text());
      return false;
    }

    console.log(`✅ Image deleted from Vercel Blob: ${imageUrl}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting Vercel Blob image:', error);
    return false;
  }
}

/** Convert a File to base64 (for preview only, not storage). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
