-- Add new fields to appointments (reminder_sent already exists)
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS parent_appointment_id UUID REFERENCES public.appointments(id),
ADD COLUMN IF NOT EXISTS visit_notes TEXT,
ADD COLUMN IF NOT EXISTS prescriptions TEXT,
ADD COLUMN IF NOT EXISTS follow_up_actions TEXT,
ADD COLUMN IF NOT EXISTS outcome TEXT;

-- Create index for finding appointments that need reminders
CREATE INDEX IF NOT EXISTS idx_appointments_reminder 
ON public.appointments(appointment_date, reminder_sent, reminder_enabled)
WHERE reminder_enabled = true AND reminder_sent = false;