-- Ensure symptoms table columns exist (table already exists)
ALTER TABLE IF EXISTS public.symptoms
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS symptom TEXT,
  ADD COLUMN IF NOT EXISTS severity TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Enable Row Level Security if not already enabled
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own symptoms" ON public.symptoms;
DROP POLICY IF EXISTS "Users can create their own symptoms" ON public.symptoms;
DROP POLICY IF EXISTS "Users can update their own symptoms" ON public.symptoms;
DROP POLICY IF EXISTS "Users can delete their own symptoms" ON public.symptoms;

-- Create policies for user access with proper casting
CREATE POLICY "Users can view their own symptoms" 
ON public.symptoms 
FOR SELECT 
USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can create their own symptoms" 
ON public.symptoms 
FOR INSERT 
WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can update their own symptoms" 
ON public.symptoms 
FOR UPDATE 
USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can delete their own symptoms" 
ON public.symptoms 
FOR DELETE 
USING (auth.uid()::TEXT = user_id::TEXT);

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS update_symptoms_updated_at ON public.symptoms;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_symptoms_updated_at
BEFORE UPDATE ON public.symptoms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_symptoms_user_id ON public.symptoms(user_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_created_at ON public.symptoms(created_at DESC);
