-- Stop anonymous listing of profile-assets and developer-headshots (SEC-06).
-- Both buckets stay public, so existing public URLs keep working: Supabase serves public-bucket objects
-- by URL without evaluating the SELECT policy. Dropping the broad anon SELECT policy only blocks the
-- list/search API. Owners get an authenticated SELECT on their own folder so their uploads and upserts still work.
-- NOT APPLIED. Apply after review.

DROP POLICY IF EXISTS "Public read access for profile assets" ON storage.objects;
DROP POLICY IF EXISTS "Headshots are publicly viewable" ON storage.objects;

CREATE POLICY "Owners can view own profile assets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners can view own headshots"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'developer-headshots' AND (storage.foldername(name))[1] = auth.uid()::text);
