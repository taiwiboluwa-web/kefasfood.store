const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const TARGET_SIZE = 450 * 1024;
const WEB_QUALITY = 0.82;

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to create image compression canvas');
    context.drawImage(bitmap, 0, 0, width, height);

    const toBlob = (quality: number) => new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', quality);
    });

    let blob = await toBlob(WEB_QUALITY);
    if (!blob) throw new Error('WebP compression is not supported by this browser');

    for (const quality of [0.74, 0.66, 0.58]) {
      if (blob.size <= TARGET_SIZE) break;
      const candidate = await toBlob(quality);
      if (candidate) blob = candidate;
    }

    if (blob.size > MAX_UPLOAD_SIZE) {
      throw new Error('Image is still too large after compression. Please choose a smaller image.');
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'product-image';
    return new File([blob], `${baseName}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

/**
 * Upload a product image through the Vercel Blob server endpoint.
 * Images are resized and converted to web-friendly WebP before upload.
 * The Blob token stays server-side and is never exposed to the browser.
 */
export async function uploadProductImage(file: File, productId: string): Promise<string | null> {
  if (file.size > MAX_FILE_SIZE) {
    console.error('File too large. Maximum source size is 10MB per image.');
    return null;
  }

  try {
    const optimizedFile = await compressImage(file);
    console.info(`Optimized ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(optimizedFile.size / 1024).toFixed(0)}KB`);

    const form = new FormData();
    form.append('file', optimizedFile);
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
      console.log(`Image uploaded to Vercel Blob: ${data.url}`);
      return data.url;
    }

    const message = typeof data?.error === 'string'
      ? data.error
      : `Upload failed with status ${response.status}`;
    console.error(`Vercel Blob upload failed: ${message}`);
    return null;
  } catch (error) {
    console.error('Product image optimization/upload failed:', error);
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
      console.error('Vercel Blob deletion failed:', await response.text());
      return false;
    }

    console.log(`Image deleted from Vercel Blob: ${imageUrl}`);
    return true;
  } catch (error) {
    console.error('Error deleting Vercel Blob image:', error);
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
