-- Fix ai_providers table schema to match expected columns
-- Drop existing table if exists and recreate with correct columns

DROP TABLE IF EXISTS ai_providers CASCADE;

CREATE TABLE ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  provider_config JSONB,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_ai_providers_user_id ON ai_providers(user_id);
CREATE INDEX idx_ai_providers_is_active ON ai_providers(is_active);

-- Enable RLS
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own providers" ON ai_providers;
CREATE POLICY "Users can view their own providers" ON ai_providers
  FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Users can insert their own providers" ON ai_providers
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Users can update their own providers" ON ai_providers
  FOR UPDATE USING (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Users can delete their own providers" ON ai_providers
  FOR DELETE USING (auth.uid()::TEXT = user_id::TEXT);
