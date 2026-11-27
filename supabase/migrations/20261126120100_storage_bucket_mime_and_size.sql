-- Server-side MIME allow-list and size cap on the four upload buckets (SEC-05).
-- Client checks alone do not stop a direct storage API call that uploads text/html or image/svg+xml.
-- SVG is deliberately excluded: served from the Supabase origin it can run script.
-- Limits only apply to new uploads; existing objects are not re-checked.
-- NOT APPLIED. Apply after review.

-- Photos: site photos and headshots/logos are images only, 5 MB.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    file_size_limit = 5242880
WHERE id IN ('profile-assets', 'developer-headshots', 'project-photos');

-- Drawings: images and PDF, 10 MB (matches ConceptDrawingsUpload).
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
    file_size_limit = 10485760
WHERE id = 'project-drawings';
