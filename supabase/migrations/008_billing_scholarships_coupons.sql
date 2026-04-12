-- Scholarships (per student), discount coupons, payment.exempt status, optional coupon on payment.

DO $$
BEGIN
  ALTER TYPE public.payment_status ADD VALUE 'exempt';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.student_scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  discount_percent NUMERIC(5, 2) NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
  note TEXT,
  valid_from_year INT NOT NULL CHECK (valid_from_year >= 2000 AND valid_from_year <= 2100),
  valid_from_month INT NOT NULL CHECK (valid_from_month >= 1 AND valid_from_month <= 12),
  valid_until_year INT NULL CHECK (valid_until_year IS NULL OR (valid_until_year >= 2000 AND valid_until_year <= 2100)),
  valid_until_month INT NULL CHECK (valid_until_month IS NULL OR (valid_until_month >= 1 AND valid_until_month <= 12)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_scholarships_one_per_student UNIQUE (student_id)
);

DROP TRIGGER IF EXISTS student_scholarships_set_updated_at ON public.student_scholarships;
CREATE TRIGGER student_scholarships_set_updated_at
  BEFORE UPDATE ON public.student_scholarships
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed_amount')),
  discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ NULL,
  max_uses INT NULL CHECK (max_uses IS NULL OR max_uses >= 0),
  uses_count INT NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS discount_coupons_code_lower_uidx ON public.discount_coupons (lower(trim(code)));

DROP TRIGGER IF EXISTS discount_coupons_set_updated_at ON public.discount_coupons;
CREATE TRIGGER discount_coupons_set_updated_at
  BEFORE UPDATE ON public.discount_coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.discount_coupons (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payments_coupon_idx ON public.payments (coupon_id);

ALTER TABLE public.student_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_scholarships_select ON public.student_scholarships;
CREATE POLICY student_scholarships_select ON public.student_scholarships
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.parent_student ps
      WHERE ps.parent_id = auth.uid() AND ps.student_id = student_scholarships.student_id
    )
  );

DROP POLICY IF EXISTS student_scholarships_admin_all ON public.student_scholarships;
CREATE POLICY student_scholarships_admin_all ON public.student_scholarships
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS discount_coupons_select ON public.discount_coupons;
CREATE POLICY discount_coupons_select ON public.discount_coupons
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS discount_coupons_admin_write ON public.discount_coupons;
CREATE POLICY discount_coupons_admin_write ON public.discount_coupons
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS discount_coupons_admin_update ON public.discount_coupons;
CREATE POLICY discount_coupons_admin_update ON public.discount_coupons
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS discount_coupons_admin_delete ON public.discount_coupons;
CREATE POLICY discount_coupons_admin_delete ON public.discount_coupons
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
