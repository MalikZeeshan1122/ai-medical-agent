-- Create table for AI API integrations (external APIs the AI can call)
CREATE TABLE IF NOT EXISTS public.ai_api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  api_name TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  base_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_api_integrations ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own API integrations" ON public.ai_api_integrations;
DROP POLICY IF EXISTS "Users can create their own API integrations" ON public.ai_api_integrations;
DROP POLICY IF EXISTS "Users can update their own API integrations" ON public.ai_api_integrations;
DROP POLICY IF EXISTS "Users can delete their own API integrations" ON public.ai_api_integrations;

-- RLS policies with proper casting
CREATE POLICY "Users can view their own API integrations"
  ON public.ai_api_integrations
  FOR SELECT
  USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can create their own API integrations"
  ON public.ai_api_integrations
  FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can update their own API integrations"
  ON public.ai_api_integrations
  FOR UPDATE
  USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can delete their own API integrations"
  ON public.ai_api_integrations
  FOR DELETE
  USING (auth.uid()::TEXT = user_id::TEXT);

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS update_ai_api_integrations_updated_at ON public.ai_api_integrations;

-- Add updated_at trigger (use correct function name)
CREATE TRIGGER update_ai_api_integrations_updated_at
  BEFORE UPDATE ON public.ai_api_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_ai_api_integrations_user_id ON public.ai_api_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_api_integrations_is_active ON public.ai_api_integrations(user_id, is_active);
