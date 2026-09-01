BEGIN;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS proposed_section_id UUID
    REFERENCES public.academic_sections(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.registrations.proposed_section_id IS
  'Admin-proposed open section while intake_state is offer_pending. preferred_section_id stays the original request until the family confirms or admin assigns.';

ALTER TABLE public.registrations
  DROP CONSTRAINT IF EXISTS registrations_intake_state_chk;

ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_intake_state_chk
  CHECK (intake_state IN (
    'none',
    'awaiting_fee',
    'receipt_pending',
    'needs_section',
    'section_full',
    'offer_pending'
  ));

DROP FUNCTION IF EXISTS public.registration_public_pay_context(text);

CREATE FUNCTION public.registration_public_pay_context(p_token text)
RETURNS TABLE (
  first_name text,
  last_name text,
  status text,
  intake_state text,
  fee_captured boolean,
  fee_snapshot jsonb,
  preferred_section_id uuid,
  additional_section_ids uuid[],
  proposed_section_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.first_name,
    r.last_name,
    r.status::text,
    r.intake_state,
    r.fee_captured,
    r.fee_snapshot,
    r.preferred_section_id,
    r.additional_section_ids,
    r.proposed_section_id
  FROM public.registrations r
  WHERE r.pay_token = p_token
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.registration_public_pay_context(text) IS
  'Safe guest projection for /matricula/[token]. No DNI, email, or tutor identity.';

REVOKE ALL ON FUNCTION public.registration_public_pay_context(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registration_public_pay_context(text) TO anon;
GRANT EXECUTE ON FUNCTION public.registration_public_pay_context(text) TO authenticated;

COMMIT;
