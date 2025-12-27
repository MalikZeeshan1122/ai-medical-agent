-- Fix appointments id column to have DEFAULT gen_random_uuid()
ALTER TABLE public.appointments
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
