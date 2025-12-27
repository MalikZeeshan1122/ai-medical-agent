-- Create AI providers configuration table
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL, -- 'openai', 'gemini', 'anthropic', 'custom'
  display_name TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  provider_config JSONB DEFAULT '{}'::jsonb, -- Additional provider-specific config
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT display_name_length CHECK (char_length(display_name) <= 100),
  CONSTRAINT model_name_length CHECK (char_length(model_name) <= 100),
  UNIQUE(user_id, display_name)
);

-- Add index for performance
CREATE INDEX idx_ai_providers_user_id ON public.ai_providers(user_id);
CREATE INDEX idx_ai_providers_active ON public.ai_providers(user_id, is_active);

-- Enable RLS
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Create trigger for updated_at
CREATE TRIGGER update_ai_providers_updated_at
BEFORE UPDATE ON public.ai_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create AI chat history table
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.ai_providers(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT content_length CHECK (char_length(content) <= 50000)
);

-- Add index for performance
CREATE INDEX idx_ai_chat_messages_user_id ON public.ai_chat_messages(user_id);
CREATE INDEX idx_ai_chat_messages_created_at ON public.ai_chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own chat messages" 
ON public.ai_chat_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages" 
ON public.ai_chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" 
ON public.ai_chat_messages 
FOR DELETE 
USING (auth.uid() = user_id);