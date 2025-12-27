-- Fix hospitals RLS policies to allow authenticated users to insert/update/delete

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "Authenticated users can update hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "Authenticated users can delete hospitals" ON public.hospitals;

-- Recreate policies with proper authentication checks
CREATE POLICY "Authenticated users can insert hospitals" 
ON public.hospitals 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update hospitals" 
ON public.hospitals 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete hospitals" 
ON public.hospitals 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);
