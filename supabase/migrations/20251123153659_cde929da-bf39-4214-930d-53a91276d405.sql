-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (basic user information)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  blood_type text CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create chronic_conditions table
CREATE TABLE public.chronic_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  condition_name text NOT NULL,
  diagnosed_date date,
  severity text CHECK (severity IN ('mild', 'moderate', 'severe')),
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create allergies table
CREATE TABLE public.allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  allergen text NOT NULL,
  allergy_type text CHECK (allergy_type IN ('food', 'medication', 'environmental', 'other')),
  severity text CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
  reaction text,
  diagnosed_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create medications table
CREATE TABLE public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  prescribing_doctor text,
  purpose text,
  side_effects text,
  is_current boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create family_history table
CREATE TABLE public.family_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  relation text NOT NULL CHECK (relation IN ('mother', 'father', 'sibling', 'maternal_grandmother', 'maternal_grandfather', 'paternal_grandmother', 'paternal_grandfather', 'child', 'other')),
  condition_name text NOT NULL,
  age_of_onset integer,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronic_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for chronic_conditions
CREATE POLICY "Users can view their own chronic conditions"
  ON public.chronic_conditions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chronic conditions"
  ON public.chronic_conditions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chronic conditions"
  ON public.chronic_conditions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chronic conditions"
  ON public.chronic_conditions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for allergies
CREATE POLICY "Users can view their own allergies"
  ON public.allergies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own allergies"
  ON public.allergies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own allergies"
  ON public.allergies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own allergies"
  ON public.allergies FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for medications
CREATE POLICY "Users can view their own medications"
  ON public.medications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medications"
  ON public.medications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications"
  ON public.medications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications"
  ON public.medications FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for family_history
CREATE POLICY "Users can view their own family history"
  ON public.family_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family history"
  ON public.family_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family history"
  ON public.family_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family history"
  ON public.family_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at on all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_chronic_conditions_updated_at
  BEFORE UPDATE ON public.chronic_conditions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_allergies_updated_at
  BEFORE UPDATE ON public.allergies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_family_history_updated_at
  BEFORE UPDATE ON public.family_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_chronic_conditions_user_id ON public.chronic_conditions(user_id);
CREATE INDEX idx_allergies_user_id ON public.allergies(user_id);
CREATE INDEX idx_medications_user_id ON public.medications(user_id);
CREATE INDEX idx_family_history_user_id ON public.family_history(user_id);
CREATE INDEX idx_medications_is_current ON public.medications(user_id, is_current) WHERE is_current = true;