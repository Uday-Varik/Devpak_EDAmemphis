-- Make project-photos and project-drawings private.
-- Files are read through short-lived signed URLs created by the owning user,
-- so the bucket-wide public SELECT policies are dropped.
UPDATE storage.buckets
SET public = false
WHERE id IN ('project-photos', 'project-drawings');

DROP POLICY IF EXISTS "Anyone can view project photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view project drawings" ON storage.objects;

-- Owner-only read. Matches the INSERT and DELETE checks: the first folder is a project the caller owns.
-- createSignedUrl runs as the caller, so this policy is also what allows signing.
CREATE POLICY "Owners can view their project photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Owners can view their project drawings"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-drawings'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.projects WHERE user_id = auth.uid()
  )
);
