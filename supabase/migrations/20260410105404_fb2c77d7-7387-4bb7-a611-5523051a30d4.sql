-- Create project-photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-photos', 'project-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create project-drawings bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-drawings', 'project-drawings', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for project-photos
CREATE POLICY "Authenticated users can upload project photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view project photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'project-photos');

CREATE POLICY "Users can delete their own project photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'project-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.projects WHERE user_id = auth.uid()
  )
);

-- RLS policies for project-drawings
CREATE POLICY "Authenticated users can upload project drawings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-drawings'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view project drawings"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'project-drawings');

CREATE POLICY "Users can delete their own project drawings"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'project-drawings'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.projects WHERE user_id = auth.uid()
  )
);