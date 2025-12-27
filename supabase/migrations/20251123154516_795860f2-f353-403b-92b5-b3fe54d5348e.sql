-- Create appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_name text NOT NULL,
  doctor_specialty text,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  duration_minutes integer DEFAULT 30,
  reason text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  location text,
  appointment_type text CHECK (appointment_type IN ('in_person', 'telehealth', 'phone')),
  reminder_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointments
CREATE POLICY "Users can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
  ON public.appointments FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(user_id, status) WHERE status = 'scheduled';
CREATE INDEX idx_appointments_datetime ON public.appointments(user_id, appointment_date, appointment_time);

-- Create a function to get upcoming appointments
CREATE OR REPLACE FUNCTION public.get_upcoming_appointments(user_uuid uuid, days_ahead integer DEFAULT 30)
RETURNS TABLE (
  id uuid,
  doctor_name text,
  doctor_specialty text,
  appointment_date date,
  appointment_time time,
  duration_minutes integer,
  reason text,
  status text,
  location text,
  appointment_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    doctor_name,
    doctor_specialty,
    appointment_date,
    appointment_time,
    duration_minutes,
    reason,
    status,
    location,
    appointment_type
  FROM public.appointments
  WHERE user_id = user_uuid
    AND appointment_date >= CURRENT_DATE
    AND appointment_date <= CURRENT_DATE + days_ahead
    AND status IN ('scheduled', 'confirmed')
  ORDER BY appointment_date ASC, appointment_time ASC;
$$;