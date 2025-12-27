-- Skip this if ai_providers table and its policies already exist
-- This migration is idempotent and won't error on existing resources

-- Ensure ai_providers table exists with correct structure
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  provider_name text NOT NULL,
  api_key_encrypted text NOT NULL,
  model_name text NOT NULL,
  provider_config jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS only if not already enabled
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

-- Drop and recreate all policies (safe approach)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own AI providers" ON public.ai_providers;
  DROP POLICY IF EXISTS "Users can insert their own AI providers" ON public.ai_providers;
  DROP POLICY IF EXISTS "Users can update their own AI providers" ON public.ai_providers;
  DROP POLICY IF EXISTS "Users can delete their own AI providers" ON public.ai_providers;
  
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Recreate policies
CREATE POLICY "Users can view their own AI providers"
ON public.ai_providers
FOR SELECT
USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can insert their own AI providers"
ON public.ai_providers
FOR INSERT
WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can update their own AI providers"
ON public.ai_providers
FOR UPDATE
USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can delete their own AI providers"
ON public.ai_providers
FOR DELETE
USING (auth.uid()::TEXT = user_id::TEXT);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_ai_providers_user_id ON public.ai_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_providers_is_active ON public.ai_providers(user_id, is_active);
