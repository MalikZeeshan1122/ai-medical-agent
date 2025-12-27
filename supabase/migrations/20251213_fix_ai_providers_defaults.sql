-- Ensure ai_providers schema matches application expectations
-- Idempotent: adds missing columns, fixes defaults, and recreates RLS policies

-- Columns
ALTER TABLE IF EXISTS public.ai_providers
  ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS provider_name TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS model_name TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS api_key_encrypted TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS provider_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Fix defaults (in case columns already existed without defaults)
ALTER TABLE IF EXISTS public.ai_providers
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN provider_config SET DEFAULT '{}'::jsonb,
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN is_default SET DEFAULT false,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_providers_user_id ON public.ai_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_providers_is_active ON public.ai_providers(is_active);

-- Enable RLS
ALTER TABLE IF EXISTS public.ai_providers ENABLE ROW LEVEL SECURITY;

-- Recreate policies to avoid duplicates and ensure proper auth.uid casting
DROP POLICY IF EXISTS "Users can view their providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can insert their providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can update their providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can delete their providers" ON public.ai_providers;

CREATE POLICY "Users can view their providers"
  ON public.ai_providers
  FOR SELECT
  USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can insert their providers"
  ON public.ai_providers
  FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can update their providers"
  ON public.ai_providers
  FOR UPDATE
  USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can delete their providers"
  ON public.ai_providers
  FOR DELETE
  USING (auth.uid()::TEXT = user_id::TEXT);
