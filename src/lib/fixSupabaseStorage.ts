/**
 * Legacy-named storage diagnostic shim.
 *
 * Product images now use Vercel Blob. Supabase is not used for product
 * storage. This filename remains temporarily so older admin imports continue
 * to work without reintroducing a Supabase dependency.
 *
 * The diagnostic performs a real server-side Vercel Blob round trip through
 * /api/blob?diagnostic=1 and returns true only when the probe can be written
 * and removed successfully.
 */
export async function diagnoseStorageIssues(): Promise<boolean> {
  try {
    const response = await fetch('/api/blob?diagnostic=1', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ diagnostic: true }),
      cache: 'no-store',
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // Keep the HTTP status as the diagnostic signal.
    }

    if (response.ok && data?.ok === true) {
      console.info('✅ Vercel Blob storage diagnostic passed.');
      return true;
    }

    console.error(
      '❌ Vercel Blob storage diagnostic failed:',
      data?.error || `HTTP ${response.status}`
    );
    return false;
  } catch (error) {
    console.error('❌ Vercel Blob storage diagnostic request failed:', error);
    return false;
  }
}
