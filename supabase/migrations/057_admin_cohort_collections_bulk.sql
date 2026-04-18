-- RPC: bulk fetch of all data needed to render the cohort collections matrix
-- (overview tab in /admin/finance). Returns one JSON document with sections,
-- enrollments, profiles, payments, scholarships and active fee plans for the
-- cohort + year, in a single round-trip.
--
-- Replaces the N+1 pattern of loadAdminCohortCollectionsOverview.ts that
-- iterated loadAdminSectionCollectionsView per section. ADR follow-up of
-- 2026-04-admin-section-collections-view.md and decision documented in
-- docs/adr/2026-04-finance-unification-tabs.md.
--
-- The function returns RAW data only — monetary computations (expected
-- amount, prorate, scholarship coverage, paid/overdue/upcoming status) are
-- composed by the application using the existing pure reducers in
-- src/lib/billing/** to avoid duplicating domain logic in plpgsql
-- (rules 03-architecture and complete-solutions-always).

CREATE OR REPLACE FUNCTION public.admin_cohort_collections_bulk(
  p_cohort_id uuid,
  p_year int
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort jsonb;
  v_sections jsonb;
  v_enrollments jsonb;
  v_profiles jsonb;
  v_payments jsonb;
  v_scholarships jsonb;
  v_plans jsonb;
  v_section_ids uuid[];
  v_student_ids uuid[];
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_year IS NULL OR p_year < 2000 OR p_year > 2100 THEN
    RAISE EXCEPTION 'invalid_year' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object('id', c.id, 'name', c.name)
    INTO v_cohort
    FROM public.academic_cohorts c
    WHERE c.id = p_cohort_id;

  IF v_cohort IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', NULL,
      'year', p_year,
      'sections', '[]'::jsonb,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'plans', '[]'::jsonb
    );
  END IF;

  SELECT array_agg(s.id), coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'archived_at', s.archived_at,
    'starts_on', s.starts_on,
    'ends_on', s.ends_on,
    'schedule_slots', coalesce(s.schedule_slots, '[]'::jsonb)
  ) ORDER BY s.name), '[]'::jsonb)
    INTO v_section_ids, v_sections
    FROM public.academic_sections s
    WHERE s.cohort_id = p_cohort_id
      AND s.archived_at IS NULL;

  IF v_section_ids IS NULL OR array_length(v_section_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', v_cohort,
      'year', p_year,
      'sections', '[]'::jsonb,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'plans', '[]'::jsonb
    );
  END IF;

  SELECT array_agg(DISTINCT e.student_id), coalesce(jsonb_agg(jsonb_build_object(
    'section_id', e.section_id,
    'student_id', e.student_id,
    'created_at', e.created_at
  )), '[]'::jsonb)
    INTO v_student_ids, v_enrollments
    FROM public.section_enrollments e
    WHERE e.section_id = ANY(v_section_ids)
      AND e.status = 'active';

  IF v_student_ids IS NULL OR array_length(v_student_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'cohort', v_cohort,
      'year', p_year,
      'sections', v_sections,
      'enrollments', '[]'::jsonb,
      'profiles', '[]'::jsonb,
      'payments', '[]'::jsonb,
      'scholarships', '[]'::jsonb,
      'plans', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', fp.id,
          'section_id', fp.section_id,
          'effective_from_year', fp.effective_from_year,
          'effective_from_month', fp.effective_from_month,
          'monthly_fee', fp.monthly_fee,
          'currency', fp.currency,
          'charges_enrollment_fee', fp.charges_enrollment_fee,
          'archived_at', fp.archived_at
        ))
        FROM public.section_fee_plans fp
        WHERE fp.section_id = ANY(v_section_ids)
          AND fp.archived_at IS NULL
      ), '[]'::jsonb)
    );
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'document_number', p.document_number
  )), '[]'::jsonb)
    INTO v_profiles
    FROM public.profiles p
    WHERE p.id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', pay.id,
    'student_id', pay.student_id,
    'section_id', pay.section_id,
    'month', pay.month,
    'year', pay.year,
    'amount', pay.amount,
    'status', pay.status,
    'receipt_url', pay.receipt_url
  )), '[]'::jsonb)
    INTO v_payments
    FROM public.payments pay
    WHERE pay.year = p_year
      AND pay.section_id = ANY(v_section_ids)
      AND pay.student_id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'student_id', sc.student_id,
    'discount_percent', sc.discount_percent,
    'valid_from_year', sc.valid_from_year,
    'valid_from_month', sc.valid_from_month,
    'valid_until_year', sc.valid_until_year,
    'valid_until_month', sc.valid_until_month,
    'is_active', sc.is_active
  )), '[]'::jsonb)
    INTO v_scholarships
    FROM public.student_scholarships sc
    WHERE sc.student_id = ANY(v_student_ids);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', fp.id,
    'section_id', fp.section_id,
    'effective_from_year', fp.effective_from_year,
    'effective_from_month', fp.effective_from_month,
    'monthly_fee', fp.monthly_fee,
    'currency', fp.currency,
    'charges_enrollment_fee', fp.charges_enrollment_fee,
    'archived_at', fp.archived_at
  )), '[]'::jsonb)
    INTO v_plans
    FROM public.section_fee_plans fp
    WHERE fp.section_id = ANY(v_section_ids)
      AND fp.archived_at IS NULL;

  RETURN jsonb_build_object(
    'cohort', v_cohort,
    'year', p_year,
    'sections', v_sections,
    'enrollments', v_enrollments,
    'profiles', v_profiles,
    'payments', v_payments,
    'scholarships', v_scholarships,
    'plans', v_plans
  );
END;
$$;

COMMENT ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) IS
  'Bulk fetch (admin only) of all raw data needed to render the cohort collections matrix in /admin/finance for a given cohort and year. Returns a single JSON document. Application composes payment status / expected amounts using src/lib/billing/** reducers. See ADR docs/adr/2026-04-finance-unification-tabs.md.';

REVOKE ALL ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_cohort_collections_bulk(uuid, int) TO authenticated;
