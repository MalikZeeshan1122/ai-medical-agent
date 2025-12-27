-- Add columns for reminder preferences
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS notification_type text DEFAULT 'email',
ADD COLUMN IF NOT EXISTS reminder_minutes_before integer DEFAULT 1440,
ADD COLUMN IF NOT EXISTS user_phone text;

-- Add phone to profiles table for SMS reminders
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text;

-- Create index for faster reminder queries
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_lookup 
ON public.appointments (appointment_date, appointment_time, reminder_enabled, reminder_sent, status)
WHERE reminder_enabled = true AND reminder_sent = false AND status = 'scheduled';