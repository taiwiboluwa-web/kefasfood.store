/**
 * Diagnostic and fix tool for Supabase Storage
 * Run this to identify and fix storage issues
 */

import { supabase } from './supabase';

const BUCKET_NAME = 'make-da50176a-product-images';

export async function diagnoseStorageIssues() {
  console.log('🔍 === SUPABASE STORAGE DIAGNOSTICS ===');

  try {
    // Test 1: Can we connect to Supabase?
    console.log('\n📡 Test 1: Testing Supabase connection...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Cannot connect to Supabase Storage');
      console.error('Error:', listError.message);
      console.log('\n💡 SOLUTION:');
      console.log('1. Check that Supabase project is running');
      console.log('2. Verify projectId and publicAnonKey are correct in utils/supabase/info.tsx');
      return false;
    }

    console.log('✅ Supabase connection working');
    console.log('Found buckets:', buckets?.map(b => b.name).join(', ') || 'none');

    // Test 2: Does our bucket exist?
    console.log('\n📦 Test 2: Checking if bucket exists...');
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log('⚠️ Bucket does not exist:', BUCKET_NAME);
      console.log('🔧 Attempting to create bucket...');

      const { data: createData, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760
      });

      if (createError) {
        console.error('❌ Failed to create bucket');
        console.error('Error:', createError.message);
        console.log('\n💡 SOLUTION:');
        console.log('1. Go to Supabase Dashboard → Storage');
        console.log('2. Click "New Bucket"');
        console.log('3. Name:', BUCKET_NAME);
        console.log('4. Make it PUBLIC');
        console.log('5. Set file size limit to 10MB');
        return false;
      }

      console.log('✅ Bucket created successfully!');
    } else {
      console.log('✅ Bucket exists:', BUCKET_NAME);
    }

    // Test 3: Can we upload to the bucket?
    console.log('\n📤 Test 3: Testing upload permissions...');
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const testPath = `test/diagnostic_${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testPath, testFile);

    if (uploadError) {
      console.error('❌ Cannot upload to bucket');
      console.error('Error:', uploadError.message);

      if (uploadError.message?.includes('policy') || uploadError.message?.includes('permission')) {
        console.log('\n💡 SOLUTION: FIX RLS POLICIES');
        console.log('The bucket exists but RLS (Row Level Security) is blocking uploads.');
        console.log('\nSteps to fix:');
        console.log('1. Go to: https://supabase.com/dashboard/project/slvyngbddtplgeiyurnq/storage/buckets');
        console.log('2. Find bucket:', BUCKET_NAME);
        console.log('3. Click the bucket name');
        console.log('4. Go to "Policies" tab');
        console.log('5. Click "New Policy"');
        console.log('6. Choose "Allow public access for uploads"');
        console.log('7. Or create custom policy:');
        console.log('   - Policy name: "Public Upload Access"');
        console.log('   - Allowed operation: INSERT');
        console.log('   - Target roles: public (anon)');
        console.log('   - Using expression: true');
        console.log('8. Save the policy');
        console.log('\nAlternatively, you can make the bucket completely public:');
        console.log('1. Go to Storage → Buckets');
        console.log('2. Click settings icon next to', BUCKET_NAME);
        console.log('3. Toggle "Public bucket" to ON');
      }

      return false;
    }

    console.log('✅ Upload test successful!');

    // Clean up test file
    await supabase.storage.from(BUCKET_NAME).remove([testPath]);
    console.log('✅ Cleanup complete');

    console.log('\n🎉 === ALL TESTS PASSED ===');
    console.log('✅ Supabase Storage is ready to use!');
    return true;

  } catch (err) {
    console.error('❌ Unexpected error during diagnostics:', err);
    return false;
  }
}

export async function fixStoragePermissions() {
  console.log('🔧 Attempting automatic fix...');

  try {
    // Try to create bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log('Creating bucket...');
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760
      });

      if (error) {
        console.error('Failed to create bucket:', error.message);
        return false;
      }

      console.log('✅ Bucket created');
    }

    console.log('\n⚠️ Note: If you still get permission errors, you need to:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Navigate to Storage → Buckets →', BUCKET_NAME);
    console.log('3. Click "Policies" tab');
    console.log('4. Add a policy allowing public uploads');

    return true;
  } catch (err) {
    console.error('Auto-fix failed:', err);
    return false;
  }
}
