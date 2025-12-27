-- Drop all dependent RLS policies FIRST
DROP POLICY IF EXISTS "Users can view their own AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can insert their own AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can update their own AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can delete their own AI providers" ON public.ai_providers;

-- Alter column type (now safe since policies are dropped)
ALTER TABLE public.ai_providers
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Recreate RLS policies with correct UUID type
CREATE POLICY "Users can view their own AI providers"
ON public.ai_providers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI providers"
ON public.ai_providers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI providers"
ON public.ai_providers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI providers"
ON public.ai_providers
FOR DELETE
USING (auth.uid() = user_id);
