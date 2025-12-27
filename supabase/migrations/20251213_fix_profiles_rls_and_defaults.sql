-- Ensure profiles table supports inserts/updates from authenticated users

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY;

-- Set default if not present (note: profiles.id often matches auth.users.id; keeping default for safety)
ALTER TABLE IF EXISTS public.profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Enable RLS
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies with proper casting
DROP POLICY IF EXISTS "Users can select their profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their profile" ON public.profiles;

CREATE POLICY "Users can select their profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update their profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can delete their profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid()::text = id::text);
