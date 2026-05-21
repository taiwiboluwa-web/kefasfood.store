-- Run this in Supabase SQL Editor to enable admin sync
-- Go to: https://supabase.com/dashboard/project/slvyngbddtplgeiyurnq/sql/new

-- Enable Row Level Security on the KV store table
ALTER TABLE kv_store_da50176a ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone to read from the KV store
CREATE POLICY "Allow public read access"
ON kv_store_da50176a
FOR SELECT
TO public
USING (true);

-- Policy 2: Allow anyone to insert/update the KV store
CREATE POLICY "Allow public write access"
ON kv_store_da50176a
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'kv_store_da50176a';
