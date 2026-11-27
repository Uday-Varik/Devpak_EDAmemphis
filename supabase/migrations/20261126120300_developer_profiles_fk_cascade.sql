-- developer_profiles.user_id had no foreign key, so profile rows with PII outlived their auth user (SEC-10).
-- Step 1 removes existing orphans. This DELETE is permanent: snapshot the table first if you want a copy.
-- Step 2 adds the FK with ON DELETE CASCADE, matching public.profiles.
-- NOT APPLIED. Apply after review.

DELETE FROM public.developer_profiles dp
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = dp.user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'developer_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE public.developer_profiles
      ADD CONSTRAINT developer_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
