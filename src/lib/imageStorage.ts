const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Upload a product image through the Vercel Blob server endpoint.
 * The Blob token stays server-side and is never exposed to the browser.
 *
 * Production products must always use a permanent cloud URL. We intentionally
 * do not fall back to localStorage because browser storage is not durable,
 * cannot be shared between devices, and is not suitable for production data.
 */
export async function uploadProductImage(file: File, productId: string): Promise<string | null> {
  if (file.size > MAX_FILE_SIZE) {
    console.error('❌ File too large. Maximum size is 10MB per image.');
    return null;
  }

  try {
    const form = new FormData();
    form.append('file', file);
    form.append('productId', productId);

    const response = await fetch('/api/blob', {
      method: 'POST',
      body: form,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // Keep the original response status for the error below.
    }

    if (response.ok && typeof data?.url === 'string' && data.url.length > 0) {
      console.log(`✅ Image uploaded to Vercel Blob: ${data.url}`);
      return data.url;
    }

    const message = typeof data?.error === 'string'
      ? data.error
      : `Upload failed with status ${response.status}`;
    console.error(`❌ Vercel Blob upload failed: ${message}`);
    return null;
  } catch (error) {
    console.error('❌ Unexpected Vercel Blob upload error:', error);
    return null;
  }
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

/** Convert a File to base64 for an in-memory UI preview only. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
