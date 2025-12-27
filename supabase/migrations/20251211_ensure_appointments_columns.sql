-- Ensure appointments table has all required columns (idempotent with IF NOT EXISTS)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS doctor_name text,
  ADD COLUMN IF NOT EXISTS doctor_specialty text,
  ADD COLUMN IF NOT EXISTS appointment_time time,
  ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS appointment_type text CHECK (appointment_type IN ('in_person', 'telehealth', 'phone')),
  ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS notification_type text,
  ADD COLUMN IF NOT EXISTS reminder_minutes_before integer,
  ADD COLUMN IF NOT EXISTS recurrence_pattern text,
  ADD COLUMN IF NOT EXISTS recurrence_end_date date,
  ADD COLUMN IF NOT EXISTS parent_appointment_id text REFERENCES public.appointments(id),
  ADD COLUMN IF NOT EXISTS visit_notes text,
  ADD COLUMN IF NOT EXISTS prescriptions text,
  ADD COLUMN IF NOT EXISTS follow_up_actions text,
  ADD COLUMN IF NOT EXISTS outcome text;

-- Set status column default only if it doesn't exist with a default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'));
  END IF;
END $$;

-- Create index for finding appointments that need reminders
CREATE INDEX IF NOT EXISTS idx_appointments_reminder 
ON public.appointments(appointment_date, reminder_sent, reminder_enabled)
WHERE reminder_enabled = true AND reminder_sent = false;
