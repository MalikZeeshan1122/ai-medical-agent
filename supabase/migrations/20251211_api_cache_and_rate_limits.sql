-- Add cache and rate limiting columns to ai_api_integrations
ALTER TABLE public.ai_api_integrations
ADD COLUMN IF NOT EXISTS cache_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cache_ttl_seconds integer DEFAULT 3600,
ADD COLUMN IF NOT EXISTS rate_limit_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rate_limit_calls integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS rate_limit_window_seconds integer DEFAULT 3600;

-- Create API usage logs table for analytics
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  integration_id uuid NOT NULL REFERENCES public.ai_api_integrations(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer,
  response_time_ms integer,
  cached boolean DEFAULT false,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create API response cache table
CREATE TABLE IF NOT EXISTS public.api_response_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.ai_api_integrations(id) ON DELETE CASCADE,
  cache_key text NOT NULL,
  response_data jsonb NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(cache_key)
);

-- Create API rate limits tracking table
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  integration_id uuid NOT NULL REFERENCES public.ai_api_integrations(id) ON DELETE CASCADE,
  window_start timestamp with time zone NOT NULL,
  calls_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, integration_id, window_start)
);

-- Enable RLS on new tables
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own API usage logs" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Users can insert their own API usage logs" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Public read access to cache" ON public.api_response_cache;
DROP POLICY IF EXISTS "Authenticated users can manage cache" ON public.api_response_cache;
DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Users can manage their own rate limits" ON public.api_rate_limits;

-- RLS Policies for api_usage_logs (with proper casting)
CREATE POLICY "Users can view their own API usage logs"
ON public.api_usage_logs
FOR SELECT
USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can insert their own API usage logs"
ON public.api_usage_logs
FOR INSERT
WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

-- RLS Policies for api_response_cache
CREATE POLICY "Public read access to cache"
ON public.api_response_cache
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage cache"
ON public.api_response_cache
FOR ALL
USING (true);

-- RLS Policies for api_rate_limits (with proper casting)
CREATE POLICY "Users can view their own rate limits"
ON public.api_rate_limits
FOR SELECT
USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can manage their own rate limits"
ON public.api_rate_limits
FOR ALL
USING (auth.uid()::TEXT = user_id::TEXT);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON public.api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_integration_id ON public.api_usage_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_response_cache_key ON public.api_response_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_response_cache_expires_at ON public.api_response_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window ON public.api_rate_limits(user_id, integration_id, window_start);
