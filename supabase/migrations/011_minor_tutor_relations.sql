-- Menores / tutores: is_minor, tutor_student_rel (reemplaza parent_student), campos tutor en registrations,
-- eventos portal para padres, auditoría de vínculos, políticas RLS actualizadas.

-- Edad legal (DB; alinear con system.properties en despliegue)
INSERT INTO public.site_settings (key, value)
VALUES ('legal_age_of_majority', '18'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.legal_age_of_majority()
RETURNS int
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT (value #>> '{}')::int FROM public.site_settings WHERE key = 'legal_age_of_majority'),
    18
  );
$$;

-- is_minor + columnas académicas / transición a facturación adulta
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_minor BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_exam_at DATE,
  ADD COLUMN IF NOT EXISTS student_portal_next_event_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS student_portal_next_event_label TEXT,
  ADD COLUMN IF NOT EXISTS billing_adult_transition_pending BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_minor IS 'True when age from birth_date is below legal_age_of_majority (recomputed on birth_date changes).';
COMMENT ON COLUMN public.profiles.billing_adult_transition_pending IS 'Admin: alumno alcanzó mayoría o requiere revisión de quién gestiona pagos.';

CREATE OR REPLACE FUNCTION public.profiles_set_age_years()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_age int;
  v_legal int;
  v_was_minor boolean;
BEGIN
  v_legal := public.legal_age_of_majority();
  IF TG_OP = 'UPDATE' THEN
    v_was_minor := COALESCE(OLD.is_minor, false);
  ELSE
    v_was_minor := false;
  END IF;

  IF NEW.birth_date IS NULL THEN
    NEW.age_years := NULL;
    NEW.is_minor := false;
  ELSE
    v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, NEW.birth_date))::integer;
    NEW.age_years := v_age;
    NEW.is_minor := v_age < v_legal;
    IF TG_OP = 'UPDATE' AND v_was_minor AND NOT NEW.is_minor THEN
      NEW.billing_adult_transition_pending := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_age_years ON public.profiles;
CREATE TRIGGER profiles_set_age_years
  BEFORE INSERT OR UPDATE OF birth_date ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_set_age_years();

UPDATE public.profiles
SET birth_date = birth_date
WHERE birth_date IS NOT NULL;

-- Registrations: datos del tutor cuando el lead es menor (validación principal en app)
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS tutor_name TEXT,
  ADD COLUMN IF NOT EXISTS tutor_dni TEXT,
  ADD COLUMN IF NOT EXISTS tutor_phone TEXT,
  ADD COLUMN IF NOT EXISTS tutor_email TEXT,
  ADD COLUMN IF NOT EXISTS tutor_relationship TEXT;

-- tutor_student_rel (antes parent_student)
CREATE TABLE IF NOT EXISTS public.tutor_student_rel (
  tutor_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  relationship TEXT,
  linked_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tutor_id, student_id),
  CONSTRAINT tutor_student_distinct CHECK (tutor_id <> student_id)
);

CREATE INDEX IF NOT EXISTS tutor_student_rel_student_idx
  ON public.tutor_student_rel (student_id);

INSERT INTO public.tutor_student_rel (tutor_id, student_id, created_at)
SELECT parent_id, student_id, created_at
FROM public.parent_student
ON CONFLICT (tutor_id, student_id) DO NOTHING;

-- Auditoría de vínculos tutor–alumno
CREATE OR REPLACE FUNCTION public.audit_tutor_student_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, payload)
    VALUES (
      COALESCE(NEW.linked_by, auth.uid()),
      'tutor_student_link',
      'tutor_student_rel',
      NEW.student_id,
      jsonb_build_object(
        'tutor_id', NEW.tutor_id,
        'student_id', NEW.student_id,
        'relationship', NEW.relationship
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tutor_student_rel_audit ON public.tutor_student_rel;
CREATE TRIGGER tutor_student_rel_audit
  AFTER INSERT ON public.tutor_student_rel
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_tutor_student_insert();

DROP TABLE IF EXISTS public.parent_student CASCADE;

ALTER TABLE public.tutor_student_rel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tutor_student_rel_select ON public.tutor_student_rel;
CREATE POLICY tutor_student_rel_select
  ON public.tutor_student_rel FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR tutor_id = auth.uid()
    OR student_id = auth.uid()
  );

DROP POLICY IF EXISTS tutor_student_rel_insert_admin ON public.tutor_student_rel;
CREATE POLICY tutor_student_rel_insert_admin
  ON public.tutor_student_rel FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS tutor_student_rel_update_admin ON public.tutor_student_rel;
CREATE POLICY tutor_student_rel_update_admin
  ON public.tutor_student_rel FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS tutor_student_rel_delete_admin ON public.tutor_student_rel;
CREATE POLICY tutor_student_rel_delete_admin
  ON public.tutor_student_rel FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Perfiles: padres/tutores leen alumnos vinculados
DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
CREATE POLICY profiles_select_own_or_admin
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = profiles.id
    )
  );

-- Inscripciones
DROP POLICY IF EXISTS enrollments_select ON public.enrollments;
CREATE POLICY enrollments_select
  ON public.enrollments FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles t WHERE t.id = auth.uid() AND t.role = 'teacher')
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = enrollments.student_id
    )
  );

-- Asistencia
DROP POLICY IF EXISTS attendance_select ON public.attendance;
CREATE POLICY attendance_select
  ON public.attendance FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles t
      WHERE t.id = auth.uid() AND t.role = 'teacher'
    )
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = attendance.student_id
    )
  );

-- Pagos
DROP POLICY IF EXISTS payments_insert_parent ON public.payments;
CREATE POLICY payments_insert_parent
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = payments.student_id
    )
  );

DROP POLICY IF EXISTS payments_update_parent ON public.payments;
CREATE POLICY payments_update_parent
  ON public.payments FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = payments.student_id
    )
    AND (parent_id IS NULL OR parent_id = auth.uid())
  )
  WITH CHECK (
    parent_id = auth.uid()
    AND status = 'pending'
  );

-- Becas / promociones (tablas de migraciones 008 y 009; opcional si el proyecto aún no las aplicó)
DO $schol$
BEGIN
  IF to_regclass('public.student_scholarships') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS student_scholarships_select ON public.student_scholarships';
    EXECUTE $pol$
CREATE POLICY student_scholarships_select ON public.student_scholarships
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = student_scholarships.student_id
    )
  );
$pol$;
  END IF;
END $schol$;

DO $promo$
BEGIN
  IF to_regclass('public.student_promotions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS student_promotions_select ON public.student_promotions';
    EXECUTE $pol$
CREATE POLICY student_promotions_select ON public.student_promotions
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = student_promotions.student_id
    )
  );
$pol$;
  END IF;
END $promo$;

-- RPC de promociones (requiere migración 009: promotions + student_promotions)
DO $apply_migration_011$
BEGIN
  IF to_regclass('public.promotions') IS NOT NULL
     AND to_regclass('public.student_promotions') IS NOT NULL THEN
    EXECUTE $fn$
CREATE OR REPLACE FUNCTION public.apply_promotion_code(p_student_id uuid, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fb$
DECLARE
  v_uid uuid := auth.uid();
  v_promo public.promotions%ROWTYPE;
  v_new_id uuid;
  v_snapshot jsonb;
  v_monthly_remaining int;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated');
  END IF;

  IF NOT (
    v_uid = p_student_id
    OR EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = v_uid AND ts.student_id = p_student_id
    )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Forbidden');
  END IF;

  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Empty code');
  END IF;

  SELECT * INTO v_promo FROM public.promotions p
  WHERE lower(trim(p.code)) = lower(trim(p_code))
    AND p.deleted_at IS NULL
    AND p.is_active = true
    AND p.valid_from <= now()
    AND (p.expires_at IS NULL OR p.expires_at > now());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Invalid or inactive promotion');
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.uses_count >= v_promo.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Promotion usage limit reached');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.student_promotions sp
    WHERE sp.student_id = p_student_id
      AND (
        (
          v_promo.applies_to IN ('enrollment', 'both')
          AND sp.applies_to_snapshot IN ('enrollment', 'both')
          AND NOT sp.enrollment_consumed
        )
        OR (
          v_promo.applies_to IN ('monthly', 'both')
          AND sp.applies_to_snapshot IN ('monthly', 'both')
          AND (sp.monthly_months_remaining IS NULL OR sp.monthly_months_remaining > 0)
        )
      )
      AND (
        NOT v_promo.is_stackable
        OR NOT COALESCE((sp.promotion_snapshot->>'is_stackable')::boolean, false)
      )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Another promotion is already active for this benefit');
  END IF;

  v_snapshot := jsonb_build_object(
    'name', v_promo.name,
    'description', v_promo.description,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value,
    'is_stackable', v_promo.is_stackable,
    'applies_to', v_promo.applies_to,
    'monthly_duration_months', v_promo.monthly_duration_months
  );

  IF v_promo.applies_to IN ('monthly', 'both') THEN
    v_monthly_remaining := v_promo.monthly_duration_months;
  ELSE
    v_monthly_remaining := NULL;
  END IF;

  INSERT INTO public.student_promotions (
    student_id,
    promotion_id,
    code_snapshot,
    promotion_snapshot,
    applied_by,
    applies_to_snapshot,
    monthly_months_remaining
  )
  VALUES (
    p_student_id,
    v_promo.id,
    trim(p_code),
    v_snapshot,
    v_uid,
    v_promo.applies_to,
    v_monthly_remaining
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'ok', true,
    'student_promotion_id', v_new_id,
    'promotion_id', v_promo.id,
    'promotion_name', v_promo.name,
    'code_snapshot', trim(p_code)
  );
END;
$fb$;
$fn$;
  END IF;
END $apply_migration_011$;

-- Recomputar edad / menoría (cron diario; cumpleaños a mitad de año)
CREATE OR REPLACE FUNCTION public.profiles_recompute_minor_flags()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
  SET
    age_years = EXTRACT(YEAR FROM age(CURRENT_DATE, p.birth_date))::integer,
    is_minor = EXTRACT(YEAR FROM age(CURRENT_DATE, p.birth_date))::integer < public.legal_age_of_majority(),
    billing_adult_transition_pending = CASE
      WHEN p.is_minor = true
        AND EXTRACT(YEAR FROM age(CURRENT_DATE, p.birth_date))::integer >= public.legal_age_of_majority()
      THEN true
      ELSE p.billing_adult_transition_pending
    END
  WHERE p.birth_date IS NOT NULL;
END;
$$;
