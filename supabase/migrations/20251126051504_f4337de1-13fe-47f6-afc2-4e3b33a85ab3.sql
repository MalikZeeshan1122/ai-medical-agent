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

-- RLS policies
CREATE POLICY "Users can view their own API integrations"
  ON public.ai_api_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API integrations"
  ON public.ai_api_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API integrations"
  ON public.ai_api_integrations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API integrations"
  ON public.ai_api_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_ai_api_integrations_updated_at
  BEFORE UPDATE ON public.ai_api_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();