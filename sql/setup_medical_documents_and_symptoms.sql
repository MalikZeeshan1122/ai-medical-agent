-- Setup tables and RLS policies for medical_documents and symptoms

create extension if not exists "pgcrypto";

-- medical_documents table
create table if not exists public.medical_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  document_type text,
  file_name text,
  file_url text,
  file_path text,
  summary text,
  uploaded_at timestamptz default now()
);

alter table public.medical_documents enable row level security;

-- drop existing policies if present and recreate with correct casts
DROP POLICY IF EXISTS users_insert_own ON public.medical_documents;
DROP POLICY IF EXISTS users_select_own ON public.medical_documents;
DROP POLICY IF EXISTS users_update_own ON public.medical_documents;
DROP POLICY IF EXISTS users_delete_own ON public.medical_documents;

CREATE POLICY users_insert_own
  ON public.medical_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY users_select_own
  ON public.medical_documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::uuid);

CREATE POLICY users_update_own
  ON public.medical_documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::uuid)
  WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY users_delete_own
  ON public.medical_documents
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::uuid);

-- symptoms table (minimal)
create table if not exists public.symptoms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

alter table public.symptoms enable row level security;

DROP POLICY IF EXISTS symptoms_insert_debug ON public.symptoms;
CREATE POLICY symptoms_insert_debug ON public.symptoms
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS symptoms_select_debug ON public.symptoms;
CREATE POLICY symptoms_select_debug ON public.symptoms
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: replace the debug policies with stricter policies after testing.
