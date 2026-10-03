-- Developer profiles table
CREATE TABLE public.developer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  entity_name TEXT,
  professional_title TEXT,
  bio TEXT,
  phone TEXT,
  email TEXT,
  licenses JSONB NOT NULL DEFAULT '[]'::jsonb,
  certifications TEXT[] NOT NULL DEFAULT '{}',
  years_experience INTEGER,
  headshot_url TEXT,
  portfolio JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own developer profile"
  ON public.developer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own developer profile"
  ON public.developer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own developer profile"
  ON public.developer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own developer profile"
  ON public.developer_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_developer_profiles_updated_at
  BEFORE UPDATE ON public.developer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for developer headshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('developer-headshots', 'developer-headshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Headshots are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'developer-headshots');

CREATE POLICY "Users can upload their own headshot"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'developer-headshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own headshot"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'developer-headshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own headshot"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'developer-headshots' AND auth.uid()::text = (storage.foldername(name))[1]);