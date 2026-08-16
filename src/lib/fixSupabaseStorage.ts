/**
 * Legacy storage diagnostic shim.
 *
 * Supabase Storage has been replaced by Vercel Blob. AdminVisits still calls
 * this diagnostic during startup, so keep the function as a harmless no-op
 * while the remaining admin code is migrated away from the legacy call.
 */
export async function diagnoseStorageIssues(): Promise<void> {
  return;
}
