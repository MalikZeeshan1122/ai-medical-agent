-- Create storage bucket for doctor photos (only if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-photos', 'doctor-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Public read access to doctor photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload doctor photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update doctor photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete doctor photos" ON storage.objects;

-- RLS policies for doctor photos
CREATE POLICY "Public read access to doctor photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'doctor-photos');

CREATE POLICY "Authenticated users can upload doctor photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'doctor-photos');

CREATE POLICY "Authenticated users can update doctor photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'doctor-photos');

CREATE POLICY "Authenticated users can delete doctor photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'doctor-photos');
