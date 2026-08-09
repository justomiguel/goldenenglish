-- Shareable per-section enrollment link: a teacher sends it to families, the family
-- fills in its own data, and the lead lands in the admin inbox bound to that section.
-- Spec: docs/superpowers/specs/2026-08-08-section-enrollment-link-design.md
--
-- The token lives in its own table rather than on academic_sections. Migration 166 runs
-- GRANT ALL ON ALL TABLES TO anon, and RLS filters rows, not columns — so a token stored
-- on a section row would be readable by any anonymous visitor who may read that section,
-- which is every current-cohort section. Measured on a local database before this was
-- rewritten: one anonymous query returned the token.

CREATE TABLE IF NOT EXISTS public.section_enrollment_links (
  section_id UUID PRIMARY KEY
    REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.section_enrollment_links IS
  'Public enrollment link per section. Unreachable over PostgREST by design: read through SECURITY DEFINER functions, written by the service role behind a server-side authorization gate.';
COMMENT ON COLUMN public.section_enrollment_links.is_active IS
  'False disables the link without discarding the row, so it can be turned back on.';

CREATE UNIQUE INDEX IF NOT EXISTS section_enrollment_links_token_key
  ON public.section_enrollment_links (token);

-- Default deny: RLS on, and deliberately no policies at all.
ALTER TABLE public.section_enrollment_links ENABLE ROW LEVEL SECURITY;

-- Not redundant with the absent policies. Migration 166's ALTER DEFAULT PRIVILEGES
-- grants ALL on newly created tables to anon and authenticated, so without this the
-- table would carry table-level privileges from the moment it is created.
REVOKE ALL ON public.section_enrollment_links FROM anon, authenticated;

-- Pre-existing exposure, fixed here by the repo owner's decision. Grants are table-wide
-- while RLS filters only rows, so anon could read every column of every current-cohort
-- section, not just the identity migrations 030 and 034 meant to expose. Verified on a
-- local database that nothing public needs this read: list_registration_section_options()
-- and resolve_section_enrollment_link() are SECURITY DEFINER and still work, and the
-- anonymous insert into registrations still passes its foreign key check, because
-- referential integrity checks bypass row security exactly as PostgreSQL documents
-- (migration 030's comment claiming otherwise is wrong). Every direct read of this table
-- in src/ is on an authenticated path.
REVOKE SELECT ON public.academic_sections FROM anon;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS source_section_link_id UUID NULL
    REFERENCES public.academic_sections (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.registrations.source_section_link_id IS
  'Section whose enrollment link produced this lead; null for the public /register form.';

CREATE INDEX IF NOT EXISTS registrations_source_section_link_idx
  ON public.registrations (source_section_link_id)
  WHERE source_section_link_id IS NOT NULL;

-- Public resolution of a token. SECURITY DEFINER so anonymous visitors never need a
-- grant or a policy on the link table, the sections table or the cohorts table.
-- Returns no rows when the link is unusable, which the app renders as one
-- "no longer available" state.
CREATE OR REPLACE FUNCTION public.resolve_section_enrollment_link(p_token uuid)
RETURNS TABLE (
  section_id UUID,
  section_name TEXT,
  cohort_name TEXT,
  schedule_slots JSONB,
  seats_remaining INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    c.name,
    s.schedule_slots,
    CASE
      WHEN s.max_students IS NULL THEN NULL
      ELSE GREATEST(
        s.max_students - (
          SELECT count(*)
          FROM public.section_enrollments se
          WHERE se.section_id = s.id
            AND se.status = 'active'
        ),
        0
      )::INT
    END
  FROM public.section_enrollment_links l
  INNER JOIN public.academic_sections s ON s.id = l.section_id
  INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
  WHERE l.token = p_token
    AND l.is_active = true
    AND s.archived_at IS NULL
    AND c.archived_at IS NULL
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.resolve_section_enrollment_link(uuid) IS
  'Section behind a public enrollment link token, or no rows when the link is inactive, archived or unknown.';

GRANT EXECUTE ON FUNCTION public.resolve_section_enrollment_link(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.resolve_section_enrollment_link(uuid) TO authenticated;

-- Server-side re-check used by the submit action: does this token still open this section?
CREATE OR REPLACE FUNCTION public.section_enrollment_link_is_open(
  p_section_id uuid,
  p_token uuid
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.section_enrollment_links l
    INNER JOIN public.academic_sections s ON s.id = l.section_id
    INNER JOIN public.academic_cohorts c ON c.id = s.cohort_id
    WHERE l.section_id = p_section_id
      AND l.token = p_token
      AND l.is_active = true
      AND s.archived_at IS NULL
      AND c.archived_at IS NULL
  );
$$;

COMMENT ON FUNCTION public.section_enrollment_link_is_open(uuid, uuid) IS
  'True when the token still opens that exact section for public submissions.';

GRANT EXECUTE ON FUNCTION public.section_enrollment_link_is_open(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.section_enrollment_link_is_open(uuid, uuid) TO authenticated;

-- Pending-lead count for the teacher panel. RLS on registrations is admin-only, so
-- without this the teacher has no way to see the number. Returns a count and nothing
-- else: no names, no documents, no contact details.
CREATE OR REPLACE FUNCTION public.section_enrollment_link_lead_count(p_section_id uuid)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_admin(auth.uid())
      OR public.user_leads_or_assists_section(auth.uid(), p_section_id)
    THEN (
      SELECT count(*)
      FROM public.registrations r
      WHERE r.source_section_link_id = p_section_id
        AND r.status <> 'enrolled'
    )
    ELSE 0::BIGINT
  END;
$$;

COMMENT ON FUNCTION public.section_enrollment_link_lead_count(uuid) IS
  'Pending leads produced by a section enrollment link; zero unless the caller is an admin or section staff.';

REVOKE ALL ON FUNCTION public.section_enrollment_link_lead_count(uuid) FROM PUBLIC;
-- FROM PUBLIC is not enough: migration 166 grants EXECUTE to the anon role directly.
REVOKE ALL ON FUNCTION public.section_enrollment_link_lead_count(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.section_enrollment_link_lead_count(uuid) TO authenticated;

-- The teacher and admin panels manage a link they cannot read directly, because the
-- table has no grants. This is their only window onto it, and it is gated on the same
-- staff check as the count. Returns no rows for anyone else.
CREATE OR REPLACE FUNCTION public.section_enrollment_link_state(p_section_id uuid)
RETURNS TABLE (
  token UUID,
  is_active BOOLEAN,
  lead_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.token,
    l.is_active,
    (
      SELECT count(*)
      FROM public.registrations r
      WHERE r.source_section_link_id = p_section_id
        AND r.status <> 'enrolled'
    )
  FROM public.section_enrollment_links l
  WHERE l.section_id = p_section_id
    AND (
      public.is_admin(auth.uid())
      OR public.user_leads_or_assists_section(auth.uid(), p_section_id)
    )
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.section_enrollment_link_state(uuid) IS
  'Token, active flag and pending lead count for a section, for admins and that section''s staff only.';

REVOKE ALL ON FUNCTION public.section_enrollment_link_state(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.section_enrollment_link_state(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.section_enrollment_link_state(uuid) TO authenticated;
