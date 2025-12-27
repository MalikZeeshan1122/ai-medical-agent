-- Ensure appointment_date column exists on appointments
ALTER TABLE IF EXISTS public.appointments
ADD COLUMN IF NOT EXISTS appointment_date date;

-- Backfill nulls with today to satisfy NOT NULL (adjust if needed)
UPDATE public.appointments
SET appointment_date = CURRENT_DATE
WHERE appointment_date IS NULL;

-- Enforce NOT NULL once backfilled
ALTER TABLE public.appointments
ALTER COLUMN appointment_date SET NOT NULL;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
