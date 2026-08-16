/**
 * Legacy-named storage diagnostic shim.
 *
 * Product images now use Vercel Blob. This function keeps the existing
 * AdminVisits import working while performing a real Blob round-trip test.
 * It does not call Supabase.
 */
export async function diagnoseStorageIssues(): Promise<boolean> {
  try {
    const testFile = new File([new Uint8Array([0])], 'kefas-storage-diagnostic.png', {
      type: 'image/png',
    });

    const form = new FormData();
    form.append('file', testFile);
    form.append('productId', '__storage_diagnostic__');

    const uploadResponse = await fetch('/api/blob', {
      method: 'POST',
      body: form,
      cache: 'no-store',
    });

    let uploadData: any = null;
    try {
      uploadData = await uploadResponse.json();
    } catch {
      // Preserve the HTTP status for the diagnostic error below.
    }

    if (!uploadResponse.ok || typeof uploadData?.url !== 'string') {
      const message = typeof uploadData?.error === 'string'
        ? uploadData.error
        : `Blob storage test upload failed with status ${uploadResponse.status}`;
      console.error(`❌ Vercel Blob storage diagnostic failed: ${message}`);
      return false;
    }

    // Clean up the diagnostic object so the test does not consume storage.
    const deleteResponse = await fetch('/api/blob', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: uploadData.url }),
      cache: 'no-store',
    });

    if (!deleteResponse.ok) {
      console.warn('⚠️ Vercel Blob upload succeeded, but diagnostic cleanup failed.');
      return true;
    }

    console.log('✅ Vercel Blob storage diagnostic passed. Upload and cleanup succeeded.');
    return true;
  } catch (error) {
    console.error('❌ Vercel Blob storage diagnostic failed:', error);
    return false;
  }
}
