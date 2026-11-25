-- Per-user request counter for the attom-comps rate limit (SEC-02).
-- Service role only: RLS is enabled with no policies, so anon/authenticated see nothing.
CREATE TABLE IF NOT EXISTS public.attom_request_log (
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attom_request_log_user_created_idx
  ON public.attom_request_log (user_id, created_at);

GRANT ALL ON public.attom_request_log TO service_role;
ALTER TABLE public.attom_request_log ENABLE ROW LEVEL SECURITY;
