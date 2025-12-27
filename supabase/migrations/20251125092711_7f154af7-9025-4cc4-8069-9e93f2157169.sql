-- Create emergency numbers table
CREATE TABLE public.emergency_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  number TEXT NOT NULL,
  label TEXT NOT NULL,
  country_region TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergency_numbers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own emergency numbers"
ON public.emergency_numbers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emergency numbers"
ON public.emergency_numbers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emergency numbers"
ON public.emergency_numbers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emergency numbers"
ON public.emergency_numbers
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_emergency_numbers_updated_at
BEFORE UPDATE ON public.emergency_numbers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();