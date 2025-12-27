-- Ensure AI providers table exists (idempotent)
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

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_providers_user_id') THEN
    CREATE INDEX idx_ai_providers_user_id ON public.ai_providers(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_providers_active') THEN
    CREATE INDEX idx_ai_providers_active ON public.ai_providers(user_id, is_active);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can insert their own AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can update their own AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can delete their own AI providers" ON public.ai_providers;

-- Create RLS policies
CREATE POLICY "Users can view their own AI providers"
ON public.ai_providers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI providers"
ON public.ai_providers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI providers"
ON public.ai_providers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI providers"
ON public.ai_providers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
