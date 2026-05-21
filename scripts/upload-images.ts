import { supabase } from '../src/lib/supabase';
import { uploadProductImage } from '../src/lib/imageStorage';
import * as fs from 'fs';
import * as path from 'path';

// Upload the local images to Supabase Storage and get permanent URLs
async function uploadImages() {
  const imagesDir = path.join(__dirname, '../src/imports');

  const images = [
    { file: 'Gemini_Generated_Image_78idby78idby78id.png', productId: 'stockfish' },
    { file: 'Gemini_Generated_Image_jccyyxjccyyxjccy.png', productId: 'crayfish-paint' },
    { file: 'Gemini_Generated_Image_oaw84moaw84moaw8-1.png', productId: 'crayfish' }
  ];

  console.log('Uploading images to Supabase Storage...');

  for (const img of images) {
    const filePath = path.join(imagesDir, img.file);
    const fileBuffer = fs.readFileSync(filePath);
    const file = new File([fileBuffer], img.file, { type: 'image/png' });

    const url = await uploadProductImage(file, img.productId);

    if (url) {
      console.log(`✅ ${img.productId}: ${url}`);
    } else {
      console.log(`❌ Failed to upload ${img.productId}`);
    }
  }
}

uploadImages().catch(console.error);
