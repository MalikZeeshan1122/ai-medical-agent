-- Simple fix: Ensure ai_providers has correct schema
BEGIN;

-- First, check if ai_providers exists and has the right columns
-- If not, create/recreate it

-- Drop and recreate is safer than ALTER when dealing with schema sync issues
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

-- Indexes
CREATE INDEX idx_ai_providers_user_id ON ai_providers(user_id);
CREATE INDEX idx_ai_providers_is_active ON ai_providers(is_active);

-- Enable RLS
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own providers" ON ai_providers
  FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can insert their own providers" ON ai_providers
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can update their own providers" ON ai_providers
  FOR UPDATE USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can delete their own providers" ON ai_providers
  FOR DELETE USING (auth.uid()::TEXT = user_id::TEXT);

COMMIT;
