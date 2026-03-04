
-- Create storage bucket for doctor images
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-images', 'doctor-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to doctor-images bucket
CREATE POLICY "Authenticated users can upload doctor images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'doctor-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update doctor images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'doctor-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete doctor images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'doctor-images');

-- Allow public read access to doctor images
CREATE POLICY "Public can view doctor images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'doctor-images');
