-- Fix ai_providers.id to auto-generate UUID
ALTER TABLE public.ai_providers
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Ensure is_active and is_default have sane defaults
ALTER TABLE public.ai_providers
  ALTER COLUMN is_active SET DEFAULT true;

ALTER TABLE public.ai_providers
  ALTER COLUMN is_default SET DEFAULT false;

-- Ensure created_at and updated_at have defaults
ALTER TABLE public.ai_providers
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.ai_providers
  ALTER COLUMN updated_at SET DEFAULT now();
