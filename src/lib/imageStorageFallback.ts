/**
 * Fallback image storage using localStorage and base64
 * Used when Supabase is unavailable
 *
 * IMPORTANT: Browser localStorage has a ~5-10MB total limit (browser-imposed)
 * For large image collections, use Supabase Storage instead
 */

const STORAGE_KEY_PREFIX = 'kefas_product_image_';

/**
 * Check available localStorage space
 */
function getLocalStorageSize(): number {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
}

/**
 * Check if there's enough space for a new item
 */
function hasSpaceFor(estimatedSize: number): boolean {
  const currentSize = getLocalStorageSize();
  const estimatedTotal = currentSize + estimatedSize;
  const maxSize = 5242880; // Conservative 5MB limit

  if (estimatedTotal > maxSize) {
    const currentMB = (currentSize / 1048576).toFixed(2);
    const neededMB = (estimatedSize / 1048576).toFixed(2);
    console.warn(`⚠️ localStorage almost full: ${currentMB}MB used. Need ${neededMB}MB more.`);
    return false;
  }

  return true;
}

/**
 * Store image as base64 in localStorage (limited to small images)
 */
export async function storeImageLocally(file: File, productId: string): Promise<string | null> {
  try {
    // Check available space first
    const estimatedBase64Size = file.size * 1.37; // Base64 is ~37% larger
    if (!hasSpaceFor(estimatedBase64Size)) {
      console.error('❌ localStorage is full. Use Supabase Storage or image URL instead.');
      return null;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const base64 = reader.result as string;
          const storageKey = `${STORAGE_KEY_PREFIX}${productId}`;

          // Store in localStorage
          localStorage.setItem(storageKey, base64);

          const usedMB = (getLocalStorageSize() / 1048576).toFixed(2);
          console.log(`✅ Image stored locally for ${productId} (${usedMB}MB used)`);
          resolve(base64);
        } catch (err) {
          if (err instanceof Error && err.name === 'QuotaExceededError') {
            console.error('❌ localStorage quota exceeded. Use Supabase Storage or image URLs.');
          } else {
            console.error('❌ Failed to store in localStorage:', err);
          }
          reject(err);
        }
      };

      reader.onerror = () => {
        console.error('❌ Failed to read file');
        reject(reader.error);
      };

      reader.readAsDataURL(file);
    });
  } catch (err) {
    console.error('❌ Error in storeImageLocally:', err);
    return null;
  }
}

/**
 * Get image from localStorage
 */
export function getLocalImage(productId: string): string | null {
  const storageKey = `${STORAGE_KEY_PREFIX}${productId}`;
  return localStorage.getItem(storageKey);
}

/**
 * Delete image from localStorage
 */
export function deleteLocalImage(productId: string): boolean {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${productId}`;
    localStorage.removeItem(storageKey);
    return true;
  } catch (err) {
    console.error('❌ Failed to delete local image:', err);
    return false;
  }
}
