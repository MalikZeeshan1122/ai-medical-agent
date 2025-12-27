-- Ensure medications table has id default and permissive RLS

ALTER TABLE IF EXISTS public.medications
  ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- Fix missing default if column existed without one
ALTER TABLE IF EXISTS public.medications
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Enable RLS
ALTER TABLE IF EXISTS public.medications ENABLE ROW LEVEL SECURITY;

-- Recreate policies with text casts
DROP POLICY IF EXISTS "Users can select their medications" ON public.medications;
DROP POLICY IF EXISTS "Users can insert their medications" ON public.medications;
DROP POLICY IF EXISTS "Users can update their medications" ON public.medications;
DROP POLICY IF EXISTS "Users can delete their medications" ON public.medications;

CREATE POLICY "Users can select their medications"
  ON public.medications
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their medications"
  ON public.medications
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their medications"
  ON public.medications
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their medications"
  ON public.medications
  FOR DELETE
  USING (auth.uid()::text = user_id::text);
