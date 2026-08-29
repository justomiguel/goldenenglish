-- Trial class intent, per-seat holds, and public CTA mode.
-- Additive only. public_cta_mode defaults to reserve except tenants whose
-- theme kind is mozarthitos / espaciozenit / liora (seed both).

BEGIN;

INSERT INTO public.site_settings (key, value, updated_at)
SELECT
  'public_cta_mode',
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.site_themes t
      WHERE t.template_kind::text IN ('mozarthitos', 'espaciozenit', 'liora')
    ) THEN '"both"'::jsonb
    ELSE '"reserve"'::jsonb
  END,
  now()
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS site_settings_select_public ON public.site_settings;

CREATE POLICY site_settings_select_public
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (
    key IN (
      'inscriptions_enabled',
      'initial_site_setup',
      'billing_currency',
      'bank_transfer_instructions',
      'billing_model',
      'public_cta_mode'
    )
  );

COMMENT ON POLICY site_settings_select_public ON public.site_settings IS
  'Public/authenticated reads for registration gating, wizard, billing, transfer instructions, billing model, and public CTA mode.';

ALTER TABLE public.academic_cohorts
  ADD COLUMN IF NOT EXISTS offers_trial BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.academic_cohorts
  ADD COLUMN IF NOT EXISTS trial_fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.academic_cohorts
  DROP CONSTRAINT IF EXISTS academic_cohorts_trial_fee_nonneg;

ALTER TABLE public.academic_cohorts
  ADD CONSTRAINT academic_cohorts_trial_fee_nonneg
  CHECK (trial_fee_amount >= 0);

ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS offers_trial BOOLEAN NULL;

ALTER TABLE public.academic_sections
  ADD COLUMN IF NOT EXISTS trial_fee_amount NUMERIC(12, 2) NULL;

ALTER TABLE public.academic_sections
  DROP CONSTRAINT IF EXISTS academic_sections_trial_fee_nonneg;

ALTER TABLE public.academic_sections
  ADD CONSTRAINT academic_sections_trial_fee_nonneg
  CHECK (trial_fee_amount IS NULL OR trial_fee_amount >= 0);

COMMENT ON COLUMN public.academic_cohorts.offers_trial IS
  'Cohort default: whether sections offer a trial class.';

COMMENT ON COLUMN public.academic_cohorts.trial_fee_amount IS
  'Cohort default trial fee. 0 = free when offered.';

COMMENT ON COLUMN public.academic_sections.offers_trial IS
  'NULL inherits the cohort. true/false overrides.';

COMMENT ON COLUMN public.academic_sections.trial_fee_amount IS
  'NULL inherits the cohort amount. 0 = free when the section offers trial.';

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS intent TEXT NOT NULL DEFAULT 'reserve';

ALTER TABLE public.registrations
  DROP CONSTRAINT IF EXISTS registrations_intent_chk;

ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_intent_chk
  CHECK (intent IN ('reserve', 'trial'));

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS trial_convert_token TEXT,
  ADD COLUMN IF NOT EXISTS trial_convert_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_fee_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS trial_fee_captured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_reschedule_token TEXT,
  ADD COLUMN IF NOT EXISTS trial_invite_sent_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_trial_convert_token_uidx
  ON public.registrations (trial_convert_token)
  WHERE trial_convert_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_trial_reschedule_token_uidx
  ON public.registrations (trial_reschedule_token)
  WHERE trial_reschedule_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.registration_trial_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.registrations (id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.academic_sections (id),
  day_of_week SMALLINT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  scheduled_on DATE NOT NULL,
  trial_fee_amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked',
  marked_at TIMESTAMPTZ,
  marked_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  admin_reminder_sent_at TIMESTAMPTZ,
  missed_mail_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT registration_trial_seats_dow_chk
    CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT registration_trial_seats_fee_nonneg
    CHECK (trial_fee_amount >= 0),
  CONSTRAINT registration_trial_seats_status_chk
    CHECK (status IN ('booked', 'attended', 'absent', 'released')),
  CONSTRAINT registration_trial_seats_visit_uidx
    UNIQUE (registration_id, section_id, scheduled_on)
);

CREATE INDEX IF NOT EXISTS registration_trial_seats_section_date_idx
  ON public.registration_trial_seats (section_id, scheduled_on);

CREATE INDEX IF NOT EXISTS registration_trial_seats_status_idx
  ON public.registration_trial_seats (status);

ALTER TABLE public.registration_trial_seats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS registration_trial_seats_admin_all ON public.registration_trial_seats;
CREATE POLICY registration_trial_seats_admin_all
  ON public.registration_trial_seats
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS registration_trial_seats_teacher_select ON public.registration_trial_seats;
CREATE POLICY registration_trial_seats_teacher_select
  ON public.registration_trial_seats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.academic_sections s
      WHERE s.id = registration_trial_seats.section_id
        AND s.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS registration_trial_seats_teacher_update ON public.registration_trial_seats;
CREATE POLICY registration_trial_seats_teacher_update
  ON public.registration_trial_seats
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.academic_sections s
      WHERE s.id = registration_trial_seats.section_id
        AND s.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.academic_sections s
      WHERE s.id = registration_trial_seats.section_id
        AND s.teacher_id = auth.uid()
    )
  );

COMMENT ON TABLE public.registration_trial_seats IS
  'One booked trial visit. booked/attended count toward section cupo.';

COMMIT;
