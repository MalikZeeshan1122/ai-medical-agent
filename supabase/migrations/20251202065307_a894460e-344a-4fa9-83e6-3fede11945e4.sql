-- Create symptoms table for tracking user symptoms
CREATE TABLE public.symptoms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptom TEXT NOT NULL,
  severity TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own symptoms" 
ON public.symptoms 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own symptoms" 
ON public.symptoms 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own symptoms" 
ON public.symptoms 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own symptoms" 
ON public.symptoms 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_symptoms_updated_at
BEFORE UPDATE ON public.symptoms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_symptoms_user_id ON public.symptoms(user_id);
CREATE INDEX idx_symptoms_created_at ON public.symptoms(created_at DESC);