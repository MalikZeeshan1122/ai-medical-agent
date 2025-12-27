-- Create emergency contacts table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  contact_type TEXT NOT NULL, -- 'emergency', 'personal', 'medical'
  is_default BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT name_length CHECK (char_length(name) <= 100),
  CONSTRAINT phone_length CHECK (char_length(phone_number) <= 30),
  CONSTRAINT notes_length CHECK (char_length(notes) <= 500)
);

-- Add index for performance
CREATE INDEX idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);

-- Enable RLS
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own emergency contacts" 
ON public.emergency_contacts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emergency contacts" 
ON public.emergency_contacts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emergency contacts" 
ON public.emergency_contacts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emergency contacts" 
ON public.emergency_contacts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_emergency_contacts_updated_at
BEFORE UPDATE ON public.emergency_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();