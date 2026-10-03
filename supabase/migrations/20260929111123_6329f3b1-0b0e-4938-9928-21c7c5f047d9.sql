CREATE TABLE public.comp_lookups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  address text,
  state text,
  zip text,
  found boolean NOT NULL DEFAULT false,
  source text NOT NULL,
  comps_returned integer NOT NULL DEFAULT 0,
  comps_after_filtering integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.comp_lookups TO service_role;
ALTER TABLE public.comp_lookups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.comp_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.comp_cache TO service_role;
ALTER TABLE public.comp_cache ENABLE ROW LEVEL SECURITY;