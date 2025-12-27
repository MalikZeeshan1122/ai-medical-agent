-- This migration skips table creation if they already exist
-- Only ensures columns and indexes are in place

-- Ensure emergency_numbers columns
ALTER TABLE IF EXISTS public.emergency_numbers
  ADD COLUMN IF NOT EXISTS country_code TEXT,
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS availability TEXT;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_emergency_numbers_country ON public.emergency_numbers(country_code);

-- Ensure emergency_contacts columns
ALTER TABLE IF EXISTS public.emergency_contacts
  ADD COLUMN IF NOT EXISTS country_code TEXT,
  ADD COLUMN IF NOT EXISTS contact_type TEXT;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);
