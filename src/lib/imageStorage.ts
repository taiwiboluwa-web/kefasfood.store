import { supabase } from './supabase';
import { storeImageLocally } from './imageStorageFallback';

const BUCKET_NAME = 'make-da50176a-product-images';
const USE_SUPABASE_FIRST = true; // Try Supabase first for unlimited storage
const MAX_FILE_SIZE = 10485760; // 10MB max per file
const LOCAL_STORAGE_FALLBACK_SIZE = 2097152; // 2MB - use localStorage only for small images as fallback

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
    console.log('✅ Supabase connected. Found', data?.length || 0, 'buckets');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection error:', err);
    return false;
  }
}

// Initialize bucket if it doesn't exist
async function ensureBucketExists() {
  try {
    console.log('🔍 Checking for bucket:', BUCKET_NAME);

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      console.error('Full error details:', JSON.stringify(listError, null, 2));
      return false;
    }

    console.log('📦 Existing buckets:', buckets?.map(b => b.name).join(', ') || 'none');

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log('🆕 Creating new bucket:', BUCKET_NAME);
      const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Make images publicly accessible
        fileSizeLimit: 10485760 // 10MB limit
        // No MIME type restrictions - accept all image formats
      });

      if (error) {
        console.error('❌ Error creating storage bucket:', error.message);
        console.error('Full error details:', JSON.stringify(error, null, 2));

        // Try to provide helpful guidance
        if (error.message?.includes('permission')) {
          console.error('💡 Storage permissions may not be enabled. Check Supabase dashboard > Storage > Policies');
        }

        return false;
      }

      console.log(`✅ Created Supabase storage bucket: ${BUCKET_NAME}`, data);
    } else {
      console.log(`✅ Bucket already exists: ${BUCKET_NAME}`);
    }

    return true;
  } catch (err) {
    console.error('❌ Error ensuring bucket exists:', err);
    return false;
  }
}

/**
 * Upload an image file to Supabase Storage
 * @param file - The image file to upload
 * @param productId - Unique identifier for the product
 * @returns Public URL of the uploaded image or null if failed
 */
export async function uploadProductImage(file: File, productId: string): Promise<string | null> {
  try {
    console.log('📤 Starting image upload...', { fileName: file.name, size: file.size, type: file.type });

    // Validate file size (10MB max per file as requested)
    if (file.size > MAX_FILE_SIZE) {
      console.error('❌ File too large. Maximum size is 10MB per image.');
      return null;
    }

    // Try Supabase Storage first (unlimited storage)
    console.log('🌐 Attempting Supabase Storage upload (recommended for unlimited storage)...');
    const connected = await testSupabaseConnection();

    if (!connected) {
      console.warn('⚠️ Supabase not available. Trying localStorage fallback...');

      // Fallback to localStorage only for small images (2MB or less)
      if (file.size <= LOCAL_STORAGE_FALLBACK_SIZE) {
        console.log('💾 Using localStorage for small image...');
        const localUrl = await storeImageLocally(file, productId);
        if (localUrl) {
          console.log('✅ Image stored locally as fallback');
          return localUrl;
        }
      }

      console.error('❌ Image too large for localStorage. Please use an image URL (Imgur, ImgBB)');
      return null;
    }

    // Ensure bucket exists
    const bucketReady = await ensureBucketExists();
    if (!bucketReady) {
      console.error('❌ Storage bucket not ready.');

      // Try localStorage fallback for small images only (2MB or less)
      if (file.size <= LOCAL_STORAGE_FALLBACK_SIZE) {
        console.log('💾 Attempting localStorage fallback...');
        const localUrl = await storeImageLocally(file, productId);
        if (localUrl) {
          console.log('✅ Image stored locally as fallback');
          return localUrl;
        }
      }

      console.error('❌ Please use an image URL instead (Imgur, ImgBB, etc.)');
      return null;
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}_${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    console.log('📁 Uploading to bucket:', BUCKET_NAME, 'path:', filePath);

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('❌ Upload failed:', error.message);
      console.error('Full error details:', JSON.stringify(error, null, 2));

      // Provide helpful guidance
      if (error.message?.includes('not found')) {
        console.error('💡 Bucket may not exist. Try refreshing the page.');
      } else if (error.message?.includes('permission') || error.message?.includes('policy')) {
        console.error('💡 Storage permissions issue. The bucket may need RLS policies configured.');
      }

      // Try localStorage fallback for small images only (2MB or less)
      if (file.size <= LOCAL_STORAGE_FALLBACK_SIZE) {
        console.log('💾 Attempting localStorage fallback...');
        const localUrl = await storeImageLocally(file, productId);
        if (localUrl) {
          console.log('✅ Image stored locally as fallback');
          return localUrl;
        }
      }

      return null;
    }

    console.log('✅ Upload successful. Data:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log(`✅ Image uploaded successfully: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error('❌ Unexpected error during upload:', err);
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');

    // Try localStorage fallback for images under 4MB
    if (file.size <= LOCAL_STORAGE_MAX_SIZE) {
      console.log('💾 Attempting localStorage fallback...');
      const localUrl = await storeImageLocally(file, productId);
      if (localUrl) {
        console.log('✅ Image stored locally as fallback');
        return localUrl;
      }
    }

    return null;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The public URL of the image to delete
 * @returns true if successful, false otherwise
 */
export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('products')).join('/');

    if (!filePath.startsWith('products/')) {
      console.error('Invalid image URL - not from product storage');
      return false;
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    console.log(`✅ Image deleted successfully: ${filePath}`);
    return true;
  } catch (err) {
    console.error('Error in deleteProductImage:', err);
    return false;
  }
}

/**
 * Convert a File to base64 (for preview only, not storage)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
