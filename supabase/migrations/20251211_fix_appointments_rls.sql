-- Fix appointments RLS policies to handle UUID properly
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;

-- Recreate policies with proper auth.uid() comparison
CREATE POLICY "Users can view their own appointments"
ON public.appointments
FOR SELECT
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own appointments"
ON public.appointments
FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own appointments"
ON public.appointments
FOR UPDATE
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own appointments"
ON public.appointments
FOR DELETE
USING (auth.uid()::text = user_id::text);
