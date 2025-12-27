-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  bio TEXT,
  phone TEXT,
  email TEXT,
  office_location TEXT,
  years_experience INTEGER,
  average_rating NUMERIC(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  availability_description TEXT,
  is_accepting_patients BOOLEAN DEFAULT true,
  consultation_fee NUMERIC(10,2),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Public read access to doctors
CREATE POLICY "Public read access to doctors"
  ON public.doctors
  FOR SELECT
  USING (true);

-- Only authenticated users can insert/update/delete doctors (for admin functionality later)
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

-- Create index on specialty for faster filtering
CREATE INDEX idx_doctors_specialty ON public.doctors(specialty);
CREATE INDEX idx_doctors_rating ON public.doctors(average_rating DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create doctor reviews table
CREATE TABLE public.doctor_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  appointment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, user_id)
);

-- Enable RLS for reviews
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;

-- Users can view all reviews
CREATE POLICY "Public read access to reviews"
  ON public.doctor_reviews
  FOR SELECT
  USING (true);

-- Users can only insert their own reviews
CREATE POLICY "Users can insert their own reviews"
  ON public.doctor_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own reviews
CREATE POLICY "Users can update their own reviews"
  ON public.doctor_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only delete their own reviews
CREATE POLICY "Users can delete their own reviews"
  ON public.doctor_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index on doctor_id for faster lookups
CREATE INDEX idx_doctor_reviews_doctor_id ON public.doctor_reviews(doctor_id);

-- Add trigger for updated_at
CREATE TRIGGER update_doctor_reviews_updated_at
  BEFORE UPDATE ON public.doctor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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

-- Trigger to update doctor rating when review is added/updated/deleted
CREATE TRIGGER update_doctor_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.doctor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_doctor_rating();

-- Insert sample doctors
INSERT INTO public.doctors (name, specialty, bio, phone, email, office_location, years_experience, average_rating, total_reviews, availability_description, consultation_fee, is_accepting_patients) VALUES
('Dr. Sarah Johnson', 'Cardiology', 'Board-certified cardiologist with 15 years of experience in heart disease prevention and treatment.', '(555) 123-4567', 'sarah.johnson@example.com', '123 Medical Plaza, Suite 200', 15, 4.8, 127, 'Mon-Fri: 9AM-5PM, Sat: 9AM-1PM', 200.00, true),
('Dr. Michael Chen', 'Pediatrics', 'Specialized in pediatric care with a gentle approach to treating children of all ages.', '(555) 234-5678', 'michael.chen@example.com', '456 Children''s Hospital Dr.', 12, 4.9, 203, 'Mon-Fri: 8AM-6PM', 150.00, true),
('Dr. Emily Rodriguez', 'Dermatology', 'Expert in skin conditions, cosmetic dermatology, and advanced laser treatments.', '(555) 345-6789', 'emily.rodriguez@example.com', '789 Skin Care Center', 10, 4.7, 156, 'Tue-Sat: 10AM-6PM', 180.00, true),
('Dr. James Wilson', 'Orthopedics', 'Specializing in sports medicine and joint replacement surgery.', '(555) 456-7890', 'james.wilson@example.com', '321 Sports Medicine Clinic', 18, 4.6, 98, 'Mon-Thu: 8AM-5PM, Fri: 8AM-3PM', 220.00, true),
('Dr. Lisa Anderson', 'Family Medicine', 'Comprehensive primary care for patients of all ages with a focus on preventive medicine.', '(555) 567-8901', 'lisa.anderson@example.com', '654 Family Health Center', 8, 4.9, 189, 'Mon-Fri: 7AM-7PM, Sat-Sun: 9AM-3PM', 120.00, true),
('Dr. Robert Taylor', 'Neurology', 'Treating neurological disorders including migraines, epilepsy, and movement disorders.', '(555) 678-9012', 'robert.taylor@example.com', '987 Brain & Spine Institute', 20, 4.5, 76, 'Mon-Wed-Fri: 9AM-4PM', 250.00, true),
('Dr. Maria Garcia', 'Obstetrics & Gynecology', 'Providing comprehensive women''s health care from adolescence through menopause.', '(555) 789-0123', 'maria.garcia@example.com', '147 Women''s Health Pavilion', 14, 4.8, 167, 'Mon-Fri: 8AM-5PM', 170.00, true),
('Dr. David Kim', 'Psychiatry', 'Mental health specialist focusing on anxiety, depression, and cognitive behavioral therapy.', '(555) 890-1234', 'david.kim@example.com', '258 Mental Wellness Center', 11, 4.7, 134, 'Tue-Sat: 10AM-7PM', 190.00, true);