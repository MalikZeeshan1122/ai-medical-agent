-- TEMPORARY: Debug and fix hospitals RLS - allow all authenticated users
-- This is for testing only. The previous policy with auth.uid() IS NOT NULL should work
-- but something is blocking it. Try a simpler approach.

-- Drop ALL existing hospital insert policies
DROP POLICY IF EXISTS "Authenticated users can insert hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "Public read access to hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "Anon can insert hospitals (TEMP)" ON public.hospitals;

-- Keep read-only policy
CREATE POLICY "Public read access" ON public.hospitals FOR SELECT USING (true);

-- Add a simple authenticated insert policy (no conditions, just verify auth role)
CREATE POLICY "Authenticated users insert" ON public.hospitals 
FOR INSERT TO authenticated 
WITH CHECK (true);

-- Allow updates and deletes for authenticated users
CREATE POLICY "Authenticated users update" ON public.hospitals 
FOR UPDATE TO authenticated 
USING (true);

CREATE POLICY "Authenticated users delete" ON public.hospitals 
FOR DELETE TO authenticated 
USING (true);
