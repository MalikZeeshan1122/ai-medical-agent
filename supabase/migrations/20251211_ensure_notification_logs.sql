-- Ensure notification_logs table columns exist (table already exists)
ALTER TABLE IF EXISTS public.notification_logs
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS message_sid TEXT,
  ADD COLUMN IF NOT EXISTS notification_type TEXT CHECK (notification_type IN ('email', 'sms', 'whatsapp')),
  ADD COLUMN IF NOT EXISTS recipient TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own notification logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Service role can manage notification logs" ON public.notification_logs;

-- Create policies with proper casting
CREATE POLICY "Users can view their own notification logs"
ON public.notification_logs
FOR SELECT
USING (auth.uid()::TEXT = user_id::TEXT);

-- Service role can insert/update (for edge functions)
CREATE POLICY "Service role can manage notification logs"
ON public.notification_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_notification_logs_message_sid ON public.notification_logs(message_sid);
CREATE INDEX IF NOT EXISTS idx_notification_logs_appointment_id ON public.notification_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS update_notification_logs_updated_at ON public.notification_logs;

-- Add trigger for updated_at
CREATE TRIGGER update_notification_logs_updated_at
BEFORE UPDATE ON public.notification_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
