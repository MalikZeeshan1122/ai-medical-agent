-- Fix UUID type mismatch in appointments table
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the foreign key constraint if it exists
ALTER TABLE public.appointments 
  DROP CONSTRAINT IF EXISTS appointments_parent_appointment_id_fkey;

-- Step 2: Change parent_appointment_id from text to uuid
DO $$
BEGIN
  -- Check if column exists and is text type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'parent_appointment_id'
    AND data_type = 'text'
  ) THEN
    -- Drop the column and recreate with correct type
    ALTER TABLE public.appointments DROP COLUMN parent_appointment_id;
    ALTER TABLE public.appointments ADD COLUMN parent_appointment_id uuid REFERENCES public.appointments(id);
  END IF;
END $$;

-- Step 3: Ensure user_id is UUID type (not text)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'user_id'
    AND data_type = 'text'
  ) THEN
    -- This is more complex - we need to handle existing data
    -- First, create a temporary column
    ALTER TABLE public.appointments ADD COLUMN user_id_new uuid;
    
    -- Copy data with cast (will fail if invalid UUIDs exist)
    UPDATE public.appointments SET user_id_new = user_id::uuid WHERE user_id IS NOT NULL;
    
    -- Drop old column and rename new one
    ALTER TABLE public.appointments DROP COLUMN user_id;
    ALTER TABLE public.appointments RENAME COLUMN user_id_new TO user_id;
    
    -- Add foreign key constraint
    ALTER TABLE public.appointments 
      ADD CONSTRAINT appointments_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

-- Step 4: Recreate RLS policies
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments" ON public.appointments
  FOR DELETE USING (auth.uid() = user_id);

-- Step 5: Also fix notification_logs table if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_logs' 
    AND column_name = 'user_id'
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public.notification_logs ADD COLUMN user_id_new uuid;
    UPDATE public.notification_logs SET user_id_new = user_id::uuid WHERE user_id IS NOT NULL;
    ALTER TABLE public.notification_logs DROP COLUMN user_id;
    ALTER TABLE public.notification_logs RENAME COLUMN user_id_new TO user_id;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_logs' 
    AND column_name = 'appointment_id'
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public.notification_logs ADD COLUMN appointment_id_new uuid;
    UPDATE public.notification_logs SET appointment_id_new = appointment_id::uuid WHERE appointment_id IS NOT NULL;
    ALTER TABLE public.notification_logs DROP COLUMN appointment_id;
    ALTER TABLE public.notification_logs RENAME COLUMN appointment_id_new TO appointment_id;
    
    -- Add foreign key
    ALTER TABLE public.notification_logs 
      ADD CONSTRAINT notification_logs_appointment_id_fkey 
      FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);
  END IF;
END $$;

-- Recreate notification_logs RLS policies
DROP POLICY IF EXISTS "Users can view their own notification logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Users can insert their own notification logs" ON public.notification_logs;

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification logs" ON public.notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification logs" ON public.notification_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

SELECT 'UUID type fix completed successfully!' as result;
