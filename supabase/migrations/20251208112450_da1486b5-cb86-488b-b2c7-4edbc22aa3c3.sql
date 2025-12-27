-- Create notification_logs table to track message delivery statuses
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message_sid TEXT UNIQUE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms', 'whatsapp')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notification logs"
ON public.notification_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert/update (for edge functions)
CREATE POLICY "Service role can manage notification logs"
ON public.notification_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_notification_logs_message_sid ON public.notification_logs(message_sid);
CREATE INDEX idx_notification_logs_appointment_id ON public.notification_logs(appointment_id);

-- Add trigger for updated_at
CREATE TRIGGER update_notification_logs_updated_at
BEFORE UPDATE ON public.notification_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();