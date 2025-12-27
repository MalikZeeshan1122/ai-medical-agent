-- Create medical_documents table
CREATE TABLE IF NOT EXISTS public.medical_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('prescription', 'test-report', 'vaccination', 'medical-history', 'other')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_path text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own documents"
  ON public.medical_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON public.medical_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.medical_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_medical_documents_user_id ON public.medical_documents(user_id);
CREATE INDEX idx_medical_documents_type ON public.medical_documents(user_id, document_type);
CREATE INDEX idx_medical_documents_date ON public.medical_documents(uploaded_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_medical_documents_updated_at
  BEFORE UPDATE ON public.medical_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
