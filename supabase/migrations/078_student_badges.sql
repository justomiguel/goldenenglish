-- Student achievement badges: grants (server-only insert) and public read by share token via RPC.

CREATE TABLE IF NOT EXISTS public.student_badge_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  public_share_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_badge_grants_badge_code_len CHECK (
    char_length(badge_code) >= 1 AND char_length(badge_code) <= 64
  ),
  CONSTRAINT student_badge_grants_student_badge_uidx UNIQUE (student_id, badge_code)
);

CREATE UNIQUE INDEX IF NOT EXISTS student_badge_grants_share_token_uidx
  ON public.student_badge_grants (public_share_token);
CREATE INDEX IF NOT EXISTS student_badge_grants_student_earned_idx
  ON public.student_badge_grants (student_id, earned_at DESC);

ALTER TABLE public.student_badge_grants ENABLE ROW LEVEL SECURITY;

-- Students can list their own grants; no direct write for authenticated (server uses service role).
DROP POLICY IF EXISTS student_badge_grants_select_own ON public.student_badge_grants;
CREATE POLICY student_badge_grants_select_own ON public.student_badge_grants
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Public read for share pages: token-based RPC (SECURITY DEFINER) only; no anon table access.

CREATE OR REPLACE FUNCTION public.get_public_student_badge_share(p_token uuid)
RETURNS TABLE (badge_code text, earned_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.badge_code, g.earned_at
  FROM public.student_badge_grants g
  WHERE g.public_share_token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_student_badge_share(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_student_badge_share(uuid) TO anon, authenticated, service_role;

COMMENT ON TABLE public.student_badge_grants IS
  'Badge awards for students. Inserts only from trusted server (service role).';
