-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/cdklguvcodbzfemyyadv/sql/new)
-- This will create the ai_providers table if it doesn't exist

CREATE TABLE IF NOT EXISTS public.ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  provider_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT display_name_length CHECK (char_length(display_name) <= 100),
  CONSTRAINT model_name_length CHECK (char_length(model_name) <= 100),
  UNIQUE(user_id, display_name)
);

CREATE INDEX IF NOT EXISTS idx_ai_providers_user_id ON public.ai_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_providers_active ON public.ai_providers(user_id, is_active);

ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can insert their own AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can update their own AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can delete their own AI providers" ON public.ai_providers;

CREATE POLICY "Users can view their own AI providers"
ON public.ai_providers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI providers"
ON public.ai_providers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI providers"
ON public.ai_providers FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI providers"
ON public.ai_providers FOR DELETE USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
