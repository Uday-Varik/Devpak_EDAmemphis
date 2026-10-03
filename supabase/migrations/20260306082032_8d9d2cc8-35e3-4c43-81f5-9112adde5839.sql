
-- Extend profiles table with developer profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS company_address text,
ADD COLUMN IF NOT EXISTS company_website text,
ADD COLUMN IF NOT EXISTS company_logo_url text,
ADD COLUMN IF NOT EXISTS years_experience integer,
ADD COLUMN IF NOT EXISTS completed_projects integer,
ADD COLUMN IF NOT EXISTS specializations text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS licenses text,
ADD COLUMN IF NOT EXISTS bio text;

-- Create storage bucket for profile assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-assets', 'profile-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own profile assets
CREATE POLICY "Users can upload own profile assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own profile assets
CREATE POLICY "Users can update own profile assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own profile assets
CREATE POLICY "Users can delete own profile assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to profile assets
CREATE POLICY "Public read access for profile assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-assets');
