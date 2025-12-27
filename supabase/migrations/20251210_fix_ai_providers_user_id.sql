-- Set column defaults for ai_providers
ALTER TABLE public.ai_providers
  ALTER COLUMN provider_config SET DEFAULT '{}'::jsonb,
  ALTER COLUMN user_id SET DEFAULT auth.uid();
