-- Matrícula, motor de promociones, historial student_promotions, auditoría.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_created_idx ON public.audit_logs (actor_id, created_at DESC);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS enrollment_fee_exempt BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enrollment_exempt_authorized_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS enrollment_exempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enrollment_exempt_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_enrollment_paid_at TIMESTAMPTZ;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_kind TEXT NOT NULL DEFAULT 'monthly'
    CHECK (payment_kind IN ('monthly', 'enrollment'));

CREATE OR REPLACE FUNCTION public.protect_profile_enrollment_billing_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.enrollment_fee_exempt IS DISTINCT FROM OLD.enrollment_fee_exempt
    OR NEW.enrollment_exempt_authorized_by IS DISTINCT FROM OLD.enrollment_exempt_authorized_by
    OR NEW.enrollment_exempt_at IS DISTINCT FROM OLD.enrollment_exempt_at
    OR NEW.enrollment_exempt_reason IS DISTINCT FROM OLD.enrollment_exempt_reason
    OR NEW.last_enrollment_paid_at IS DISTINCT FROM OLD.last_enrollment_paid_at
  THEN
    RAISE EXCEPTION 'Solo administradores pueden modificar datos de matrícula y exenciones';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enrollment_billing_guard ON public.profiles;
CREATE TRIGGER profiles_enrollment_billing_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_enrollment_billing_fields();

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed_amount')),
  discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  applies_to TEXT NOT NULL CHECK (applies_to IN ('enrollment', 'monthly', 'both')),
  monthly_duration_months INT NULL CHECK (monthly_duration_months IS NULL OR monthly_duration_months >= 0),
  is_stackable BOOLEAN NOT NULL DEFAULT false,
  max_uses INT NULL CHECK (max_uses IS NULL OR max_uses >= 0),
  uses_count INT NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS promotions_code_lower_active_uidx
  ON public.promotions (lower(trim(code)))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS promotions_active_idx ON public.promotions (is_active, deleted_at, expires_at);

DROP TRIGGER IF EXISTS promotions_set_updated_at ON public.promotions;
CREATE TRIGGER promotions_set_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.student_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES public.promotions (id) ON DELETE SET NULL,
  code_snapshot TEXT NOT NULL,
  promotion_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  applies_to_snapshot TEXT NOT NULL CHECK (applies_to_snapshot IN ('enrollment', 'monthly', 'both')),
  monthly_months_remaining INT NULL CHECK (monthly_months_remaining IS NULL OR monthly_months_remaining >= 0),
  enrollment_consumed BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS student_promotions_student_idx ON public.student_promotions (student_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS student_promotions_promotion_idx ON public.student_promotions (promotion_id);

CREATE OR REPLACE FUNCTION public.increment_promotion_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.promotion_id IS NOT NULL THEN
    UPDATE public.promotions
    SET uses_count = uses_count + 1
    WHERE id = NEW.promotion_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS student_promotions_usage ON public.student_promotions;
CREATE TRIGGER student_promotions_usage
  AFTER INSERT ON public.student_promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_promotion_usage();

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_admin_select ON public.audit_logs;
CREATE POLICY audit_logs_admin_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS audit_logs_admin_insert ON public.audit_logs;
CREATE POLICY audit_logs_admin_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND actor_id = auth.uid());

DROP POLICY IF EXISTS promotions_admin_all ON public.promotions;
CREATE POLICY promotions_admin_all ON public.promotions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS student_promotions_select ON public.student_promotions;
CREATE POLICY student_promotions_select ON public.student_promotions
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.parent_student ps
      WHERE ps.parent_id = auth.uid() AND ps.student_id = student_promotions.student_id
    )
  );

DROP POLICY IF EXISTS student_promotions_insert ON public.student_promotions;
CREATE POLICY student_promotions_insert ON public.student_promotions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_promotion_code(p_code text)
RETURNS TABLE (
  ok boolean,
  message text,
  promotion_id uuid,
  discount_type text,
  discount_value numeric,
  applies_to text,
  monthly_duration_months int,
  is_stackable boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.promotions%ROWTYPE;
BEGIN
  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN QUERY SELECT false, 'Empty code'::text, NULL::uuid, NULL::text, NULL::numeric, NULL::text, NULL::int, NULL::boolean;
    RETURN;
  END IF;

  SELECT * INTO r FROM public.promotions p
  WHERE lower(trim(p.code)) = lower(trim(p_code))
    AND p.deleted_at IS NULL
    AND p.is_active = true
    AND p.valid_from <= now()
    AND (p.expires_at IS NULL OR p.expires_at > now());

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid or inactive promotion'::text, NULL::uuid, NULL::text, NULL::numeric, NULL::text, NULL::int, NULL::boolean;
    RETURN;
  END IF;

  IF r.max_uses IS NOT NULL AND r.uses_count >= r.max_uses THEN
    RETURN QUERY SELECT false, 'Promotion usage limit reached'::text, NULL::uuid, NULL::text, NULL::numeric, NULL::text, NULL::int, NULL::boolean;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    true,
    'OK'::text,
    r.id,
    r.discount_type,
    r.discount_value,
    r.applies_to,
    r.monthly_duration_months,
    r.is_stackable;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_promotion_code(p_student_id uuid, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      SELECT 1 FROM public.parent_student ps
      WHERE ps.parent_id = v_uid AND ps.student_id = p_student_id
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
$$;

GRANT EXECUTE ON FUNCTION public.validate_promotion_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_promotion_code(uuid, text) TO authenticated;
