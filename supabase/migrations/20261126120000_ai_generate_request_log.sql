-- Per-user request log for the ai-generate rate limit (SEC-04).
-- The old limit was an in-memory Map per isolate, so it reset on cold start and did not share across instances.
-- Service role only: RLS is enabled with no policies, so anon/authenticated see nothing.
-- NOT APPLIED. Apply after review.
CREATE TABLE IF NOT EXISTS public.ai_generate_request_log (
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_generate_request_log_user_created_idx
  ON public.ai_generate_request_log (user_id, created_at);

GRANT ALL ON public.ai_generate_request_log TO service_role;
ALTER TABLE public.ai_generate_request_log ENABLE ROW LEVEL SECURITY;
