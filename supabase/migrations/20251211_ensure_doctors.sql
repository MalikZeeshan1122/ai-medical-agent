-- Ensure doctors table columns exist (table already exists)
ALTER TABLE IF EXISTS public.doctors
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS specialty TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS office_location TEXT,
  ADD COLUMN IF NOT EXISTS years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS availability_description TEXT,
  ADD COLUMN IF NOT EXISTS is_accepting_patients BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Enable RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Public read access to doctors" ON public.doctors;
DROP POLICY IF EXISTS "Authenticated users can insert doctors" ON public.doctors;
DROP POLICY IF EXISTS "Authenticated users can update doctors" ON public.doctors;
DROP POLICY IF EXISTS "Authenticated users can delete doctors" ON public.doctors;

-- Create policies
CREATE POLICY "Public read access to doctors"
  ON public.doctors
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert doctors"
  ON public.doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update doctors"
  ON public.doctors
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete doctors"
  ON public.doctors
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON public.doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_rating ON public.doctors(average_rating DESC);

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS update_doctors_updated_at ON public.doctors;

-- Add trigger for updated_at
CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Ensure doctor_reviews table columns
ALTER TABLE IF EXISTS public.doctor_reviews
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS review_text TEXT,
  ADD COLUMN IF NOT EXISTS appointment_date DATE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Enable RLS for reviews
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Public read access to reviews" ON public.doctor_reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.doctor_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.doctor_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.doctor_reviews;

-- Create policies with proper casting
CREATE POLICY "Public read access to reviews"
  ON public.doctor_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own reviews"
  ON public.doctor_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can update their own reviews"
  ON public.doctor_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can delete their own reviews"
  ON public.doctor_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid()::TEXT = user_id::TEXT);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_doctor_id ON public.doctor_reviews(doctor_id);

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS update_doctor_reviews_updated_at ON public.doctor_reviews;

-- Add trigger for updated_at
CREATE TRIGGER update_doctor_reviews_updated_at
  BEFORE UPDATE ON public.doctor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Drop old function if it exists
DROP FUNCTION IF EXISTS public.update_doctor_rating();

-- Function to update doctor's average rating
CREATE OR REPLACE FUNCTION public.update_doctor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.doctors
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.doctor_reviews
      WHERE doctor_id = COALESCE(NEW.doctor_id, OLD.doctor_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.doctor_reviews
      WHERE doctor_id = COALESCE(NEW.doctor_id, OLD.doctor_id)
    )
  WHERE id = COALESCE(NEW.doctor_id, OLD.doctor_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS update_doctor_rating_on_review_change ON public.doctor_reviews;

-- Trigger to update doctor rating when review is added/updated/deleted
CREATE TRIGGER update_doctor_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.doctor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_doctor_rating();
