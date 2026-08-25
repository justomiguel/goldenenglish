-- Isolated E2E fixtures for local `supabase start` only.
-- Credentials match e2e/buildE2eLocalEnvFile.ts defaults.
-- Idempotent. Do not use against tenant/prod projects.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helper: upsert auth user + profile
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._e2e_upsert_user(
  p_email text,
  p_password text,
  p_role public.user_role,
  p_first text,
  p_last text,
  p_dni text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_instance uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  v_meta jsonb := jsonb_build_object(
    'first_name', p_first,
    'last_name', p_last,
    'dni_or_passport', p_dni
  );
BEGIN
  -- Prefer email match; if ward-email E2E (or similar) changed login, recover by DNI.
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;

  IF v_user_id IS NULL AND p_dni IS NOT NULL AND length(trim(p_dni)) > 0 THEN
    SELECT p.id INTO v_user_id
    FROM public.profiles p
    WHERE lower(trim(both FROM p.dni_or_passport)) = lower(trim(both FROM p_dni))
    LIMIT 1;
  END IF;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      instance_id = v_instance,
      aud = 'authenticated',
      role = 'authenticated',
      email = lower(p_email),
      encrypted_password = crypt(p_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmation_token = '',
      recovery_token = '',
      email_change = '',
      email_change_token_new = '',
      email_change_token_current = COALESCE(email_change_token_current, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      is_sso_user = false,
      is_anonymous = false,
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = v_meta,
      updated_at = now()
    WHERE id = v_user_id;
  ELSE
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token, email_change,
      email_change_token_new, is_sso_user, is_anonymous,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    VALUES (
      v_user_id, v_instance, 'authenticated', 'authenticated', lower(p_email),
      crypt(p_password, gen_salt('bf')),
      now(), '', '', '', '', false, false,
      '{"provider":"email","providers":["email"]}'::jsonb,
      v_meta, now(), now()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = v_user_id AND i.provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', lower(p_email)),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
  ELSE
    UPDATE auth.identities
    SET
      identity_data = jsonb_set(
        COALESCE(identity_data, '{}'::jsonb),
        '{email}',
        to_jsonb(lower(p_email))
      ),
      updated_at = now()
    WHERE user_id = v_user_id AND provider = 'email';
  END IF;

  INSERT INTO public.profiles (id, role, first_name, last_name, dni_or_passport, phone, birth_date)
  VALUES (
    v_user_id,
    p_role,
    p_first,
    p_last,
    p_dni,
    CASE WHEN p_role = 'student' THEN '+5491100000001' ELSE NULL END,
    -- Adult DOB so canAccessPaymentsModule stays true (minors redirect off /payments).
    CASE WHEN p_role = 'student' THEN DATE '2000-06-15' ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    dni_or_passport = EXCLUDED.dni_or_passport,
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    birth_date = COALESCE(EXCLUDED.birth_date, public.profiles.birth_date),
    updated_at = now();

  RETURN v_user_id;
END;
$$;

DO $$
DECLARE
  v_pw text := 'E2eLocal!Stack1';
  v_admin uuid;
  v_teacher uuid;
  v_student uuid;
  v_student_b uuid;
  v_parent uuid;
  v_cohort uuid;
  v_section uuid;
  v_year int := EXTRACT(YEAR FROM CURRENT_DATE)::int;
  v_month int := EXTRACT(MONTH FROM CURRENT_DATE)::int;
  v_parent_month int;
  v_reject_month int;
  v_record_month int;
  v_tour_invoice uuid := '00000000-0000-4000-8000-e2e000000002'::uuid;
  v_tour_receipt uuid := '00000000-0000-4000-8000-e2e000000001'::uuid;
  v_tour_receipt_path text;
BEGIN
  v_parent_month := CASE WHEN v_month < 12 THEN v_month + 1 ELSE v_month - 1 END;
  -- Third due month for reject-receipt E2E (distinct from student + parent months).
  v_reject_month := CASE
    WHEN v_month <= 10 THEN v_month + 2
    WHEN v_month = 11 THEN 9
    ELSE 10
  END;
  v_record_month := CASE
    WHEN v_month <= 9 THEN v_month + 3
    WHEN v_month = 10 THEN 8
    WHEN v_month = 11 THEN 7
    ELSE 6
  END;
  v_admin := public._e2e_upsert_user(
    'e2e-admin@example.test', v_pw, 'admin', 'E2E', 'Admin', 'E2E-ADM-01'
  );
  v_teacher := public._e2e_upsert_user(
    'e2e-teacher@example.test', v_pw, 'teacher', 'E2E', 'Teacher', 'E2E-TCH-01'
  );
  v_student := public._e2e_upsert_user(
    'e2e-student@example.test', v_pw, 'student', 'E2E', 'Student', 'E2E-STU-01'
  );
  -- Unenrolled student for section-enroll E2E (do not touch e2e-student payments fixture).
  v_student_b := public._e2e_upsert_user(
    'e2e-student-b@example.test', v_pw, 'student', 'E2E', 'EnrolleeB', 'E2E-STU-B1'
  );
  v_parent := public._e2e_upsert_user(
    'e2e-parent@example.test', v_pw, 'parent', 'E2E', 'Parent', 'E2E-PAR-01'
  );

  INSERT INTO public.site_settings (key, value, updated_at)
  VALUES ('inscriptions_enabled', 'true'::jsonb, now())
  ON CONFLICT (key) DO UPDATE SET value = 'true'::jsonb, updated_at = now();

  INSERT INTO public.academic_cohorts (name, slug, starts_on, ends_on, is_current)
  VALUES (
    'E2E Cohort',
    'e2e-cohort',
    make_date(v_year, 1, 1),
    make_date(v_year, 12, 31),
    true
  )
  ON CONFLICT (slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    starts_on = EXCLUDED.starts_on,
    ends_on = EXCLUDED.ends_on,
    is_current = true,
    archived_at = NULL,
    updated_at = now()
  RETURNING id INTO v_cohort;

  SELECT id INTO v_cohort FROM public.academic_cohorts WHERE slug = 'e2e-cohort';

  SELECT s.id INTO v_section
  FROM public.academic_sections s
  WHERE s.cohort_id = v_cohort AND s.name = 'E2E Section A'
  LIMIT 1;

  -- Enrollment preview requires ≥1 schedule slot (empty [] → PARSE in app).
  IF v_section IS NULL THEN
    INSERT INTO public.academic_sections (
      cohort_id, name, teacher_id, schedule_slots,
      starts_on, ends_on, enrollment_fee_amount, monthly_fee_charge_mode,
      allow_advance_monthly_payment
    )
    VALUES (
      v_cohort,
      'E2E Section A',
      v_teacher,
      '[{"dayOfWeek":1,"startTime":"10:00","endTime":"11:00"}]'::jsonb,
      make_date(v_year, 1, 1),
      make_date(v_year, 12, 31),
      0,
      'full_month_fee',
      true
    )
    RETURNING id INTO v_section;
  ELSE
    UPDATE public.academic_sections
    SET
      teacher_id = v_teacher,
      archived_at = NULL,
      starts_on = make_date(v_year, 1, 1),
      ends_on = make_date(v_year, 12, 31),
      schedule_slots = '[{"dayOfWeek":1,"startTime":"10:00","endTime":"11:00"}]'::jsonb,
      -- Parent/reject E2E dues use future months; strip must allow advance pay.
      allow_advance_monthly_payment = true,
      monthly_fee_charge_mode = 'full_month_fee',
      updated_at = now()
    WHERE id = v_section;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.academic_sections
    WHERE cohort_id = v_cohort AND name = 'E2E Section B'
  ) THEN
    INSERT INTO public.academic_sections (
      cohort_id, name, teacher_id, schedule_slots,
      starts_on, ends_on, enrollment_fee_amount, monthly_fee_charge_mode,
      allow_advance_monthly_payment
    )
    VALUES (
      v_cohort,
      'E2E Section B',
      v_teacher,
      '[{"dayOfWeek":2,"startTime":"10:00","endTime":"11:00"}]'::jsonb,
      make_date(v_year, 1, 1),
      make_date(v_year, 12, 31),
      0,
      'full_month_fee',
      true
    );
  ELSE
    UPDATE public.academic_sections
    SET
      teacher_id = v_teacher,
      archived_at = NULL,
      starts_on = make_date(v_year, 1, 1),
      ends_on = make_date(v_year, 12, 31),
      schedule_slots = '[{"dayOfWeek":2,"startTime":"10:00","endTime":"11:00"}]'::jsonb,
      allow_advance_monthly_payment = true,
      monthly_fee_charge_mode = 'full_month_fee',
      updated_at = now()
    WHERE cohort_id = v_cohort AND name = 'E2E Section B';
  END IF;

  INSERT INTO public.section_fee_plans (
    section_id, effective_from_year, effective_from_month, monthly_fee, currency
  )
  VALUES (v_section, v_year, 1, 100, 'USD')
  ON CONFLICT (section_id, effective_from_year, effective_from_month) DO UPDATE
  SET monthly_fee = 100, archived_at = NULL, updated_at = now();

  INSERT INTO public.section_fee_plans (
    section_id, effective_from_year, effective_from_month, monthly_fee, currency
  )
  SELECT s.id, v_year, 1, 100, 'USD'
  FROM public.academic_sections s
  WHERE s.cohort_id = v_cohort AND s.name = 'E2E Section B'
  ON CONFLICT (section_id, effective_from_year, effective_from_month) DO UPDATE
  SET monthly_fee = 100, archived_at = NULL, updated_at = now();

  UPDATE public.section_enrollments
  SET status = 'dropped', updated_at = now()
  WHERE student_id = v_student
    AND status = 'active'
    AND section_id IS DISTINCT FROM v_section;

  IF NOT EXISTS (
    SELECT 1 FROM public.section_enrollments
    WHERE section_id = v_section AND student_id = v_student AND status = 'active'
  ) THEN
    INSERT INTO public.section_enrollments (section_id, student_id, status)
    VALUES (v_section, v_student, 'active');
  END IF;

  -- Keep student-b available to enroll via UI (idempotent reseed between suite runs).
  UPDATE public.section_enrollments
  SET status = 'dropped', updated_at = now()
  WHERE student_id = v_student_b
    AND section_id = v_section
    AND status = 'active';

  INSERT INTO public.tutor_student_rel (tutor_id, student_id, relationship, linked_by)
  VALUES (v_parent, v_student, 'parent', v_admin)
  ON CONFLICT (tutor_id, student_id) DO UPDATE
  SET financial_access_revoked_at = NULL;

  -- Fee plan so student monthly grid shows a payable "due" cell.
  IF NOT EXISTS (
    SELECT 1 FROM public.section_fee_plans
    WHERE section_id = v_section
      AND effective_from_year = v_year
      AND effective_from_month = 1
      AND archived_at IS NULL
  ) THEN
    INSERT INTO public.section_fee_plans (
      section_id, effective_from_year, effective_from_month, monthly_fee, currency
    )
    VALUES (v_section, v_year, 1, 100, 'USD');
  ELSE
    UPDATE public.section_fee_plans
    SET monthly_fee = 100, currency = 'USD', updated_at = now()
    WHERE section_id = v_section
      AND effective_from_year = v_year
      AND effective_from_month = 1
      AND archived_at IS NULL;
  END IF;

  -- Due month without receipt — student E2E uploads, then admin approves.
  IF EXISTS (
    SELECT 1 FROM public.payments
    WHERE student_id = v_student
      AND section_id = v_section
      AND month = v_month
      AND year = v_year
  ) THEN
    UPDATE public.payments
    SET
      status = 'pending',
      amount = 100,
      parent_id = v_parent,
      receipt_url = NULL,
      updated_at = now()
    WHERE student_id = v_student
      AND section_id = v_section
      AND month = v_month
      AND year = v_year;
  ELSE
    INSERT INTO public.payments (
      student_id, parent_id, section_id, month, year, amount, status, payment_kind, receipt_url
    )
    VALUES (
      v_student, v_parent, v_section, v_month, v_year, 100, 'pending', 'monthly',
      NULL
    );
  END IF;

  -- Second due month for parent receipt E2E (avoids race with student current-month flow).
  IF EXISTS (
    SELECT 1 FROM public.payments
    WHERE student_id = v_student
      AND section_id = v_section
      AND month = v_parent_month
      AND year = v_year
  ) THEN
    UPDATE public.payments
    SET
      status = 'pending',
      amount = 100,
      parent_id = v_parent,
      receipt_url = NULL,
      updated_at = now()
    WHERE student_id = v_student
      AND section_id = v_section
      AND month = v_parent_month
      AND year = v_year;
  ELSE
    INSERT INTO public.payments (
      student_id, parent_id, section_id, month, year, amount, status, payment_kind, receipt_url
    )
    VALUES (
      v_student, v_parent, v_section, v_parent_month, v_year, 100, 'pending', 'monthly',
      NULL
    );
  END IF;

  -- Third due month for admin reject-receipt E2E (after student + parent consume the first two).
  IF EXISTS (
    SELECT 1 FROM public.payments
    WHERE student_id = v_student
      AND section_id = v_section
      AND month = v_reject_month
      AND year = v_year
  ) THEN
    UPDATE public.payments
    SET
      status = 'pending',
      amount = 100,
      parent_id = v_parent,
      receipt_url = NULL,
      updated_at = now()
    WHERE student_id = v_student
      AND section_id = v_section
      AND month = v_reject_month
      AND year = v_year;
  ELSE
    INSERT INTO public.payments (
      student_id, parent_id, section_id, month, year, amount, status, payment_kind, receipt_url
    )
    VALUES (
      v_student, v_parent, v_section, v_reject_month, v_year, 100, 'pending', 'monthly',
      NULL
    );
  END IF;

  -- Fourth due month for admin record-payment-without-receipt E2E.
  IF EXISTS (
    SELECT 1 FROM public.payments
    WHERE student_id = v_student
      AND section_id = v_section
      AND month = v_record_month
      AND year = v_year
  ) THEN
    UPDATE public.payments
    SET
      status = 'pending',
      amount = 100,
      parent_id = v_parent,
      receipt_url = NULL,
      updated_at = now()
    WHERE student_id = v_student
      AND section_id = v_section
      AND month = v_record_month
      AND year = v_year;
  ELSE
    INSERT INTO public.payments (
      student_id, parent_id, section_id, month, year, amount, status, payment_kind, receipt_url
    )
    VALUES (
      v_student, v_parent, v_section, v_record_month, v_year, 100, 'pending', 'monthly',
      NULL
    );
  END IF;

  -- Free published event for anonymous public register E2E.
  INSERT INTO public.events (
    slug, title, description, event_date, location, capacity,
    price, price_local, price_non_local, currency, status, default_locale,
    created_by, published_at, collect_birth_date
  )
  VALUES (
    'e2e-free-event',
    'E2E Free Event',
    'Isolated stack free registration fixture.',
    (make_date(v_year, LEAST(v_month + 1, 12), 15) + TIME '18:00') AT TIME ZONE 'UTC',
    'E2E Hall',
    50,
    0, 0, 0, 'USD', 'published', 'es',
    v_admin, now(), false
  )
  ON CONFLICT (slug) DO UPDATE
  SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    event_date = EXCLUDED.event_date,
    capacity = EXCLUDED.capacity,
    price = 0,
    price_local = 0,
    price_non_local = 0,
    status = 'published',
    published_at = COALESCE(public.events.published_at, now()),
    archived_at = NULL,
    collect_birth_date = false,
    updated_at = now();

  INSERT INTO public.event_translations (event_id, locale, title, description, location)
  SELECT e.id, loc.locale, loc.title, loc.description, 'E2E Hall'
  FROM public.events e
  CROSS JOIN (
    VALUES
      ('es', 'Evento gratis E2E', 'Fixture de inscripción gratuita para el stack aislado.'),
      ('en', 'E2E Free Event', 'Isolated stack free registration fixture.'),
      ('pt', 'Evento grátis E2E', 'Fixture de inscrição gratuita para o stack isolado.')
  ) AS loc(locale, title, description)
  WHERE e.slug = 'e2e-free-event'
  ON CONFLICT (event_id, locale) DO UPDATE
  SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    location = EXCLUDED.location,
    updated_at = now();

  -- Paid published event — bank transfer only (USD → no gateway country on isolated seed).
  INSERT INTO public.events (
    slug, title, description, event_date, location, capacity,
    price, price_local, price_non_local, currency, status, default_locale,
    created_by, published_at, collect_birth_date,
    bank_transfer_instructions
  )
  VALUES (
    'e2e-paid-event',
    'E2E Paid Event',
    'Isolated stack paid registration (bank transfer).',
    (make_date(v_year, LEAST(v_month + 2, 12), 15) + TIME '18:00') AT TIME ZONE 'UTC',
    'E2E Hall',
    50,
    25.00, 25.00, 25.00, 'USD', 'published', 'es',
    v_admin, now(), false,
    'E2E test account — reference: E2E-PAID'
  )
  ON CONFLICT (slug) DO UPDATE
  SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    event_date = EXCLUDED.event_date,
    capacity = EXCLUDED.capacity,
    price = 25.00,
    price_local = 25.00,
    price_non_local = 25.00,
    currency = 'USD',
    status = 'published',
    published_at = COALESCE(public.events.published_at, now()),
    archived_at = NULL,
    collect_birth_date = false,
    bank_transfer_instructions = EXCLUDED.bank_transfer_instructions,
    updated_at = now();

  INSERT INTO public.event_translations (event_id, locale, title, description, location)
  SELECT e.id, loc.locale, loc.title, loc.description, 'E2E Hall'
  FROM public.events e
  CROSS JOIN (
    VALUES
      ('es', 'Evento pago E2E', 'Fixture de inscripción con transferencia.'),
      ('en', 'E2E Paid Event', 'Isolated stack paid bank-transfer fixture.'),
      ('pt', 'Evento pago E2E', 'Fixture de inscrição com transferência.')
  ) AS loc(locale, title, description)
  WHERE e.slug = 'e2e-paid-event'
  ON CONFLICT (event_id, locale) DO UPDATE
  SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    location = EXCLUDED.location,
    updated_at = now();

  -- Repeated isolated precommit runs fill e2e-paid-event (capacity 50). A full
  -- event waitlists new transfers, skips the receipt upload, and leaves
  -- critical-event-payment-approve with no payment row to approve.
  DELETE FROM public.event_attendees
  WHERE event_id IN (
    SELECT id FROM public.events WHERE slug IN ('e2e-paid-event', 'e2e-free-event')
  )
    AND primary_attendee_id IS NOT NULL;
  DELETE FROM public.event_attendees
  WHERE event_id IN (
    SELECT id FROM public.events WHERE slug IN ('e2e-paid-event', 'e2e-free-event')
  );

  -- Admin tour L3: pending billing receipt (storage object uploaded in e2e-stack-up).
  v_tour_receipt_path :=
    v_student::text || '/' || v_tour_invoice::text || '/' || v_tour_receipt::text || '.png';

  INSERT INTO public.billing_invoices (
    id, student_id, amount, due_date, status, description
  )
  VALUES (
    v_tour_invoice,
    v_student,
    100,
    make_date(v_year, GREATEST(v_month, 1), 1),
    'verifying',
    'E2E tour receipt invoice'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    student_id = EXCLUDED.student_id,
    amount = 100,
    status = 'verifying',
    description = EXCLUDED.description,
    updated_at = now();

  DELETE FROM public.billing_receipts
  WHERE invoice_id = v_tour_invoice
    AND id IS DISTINCT FROM v_tour_receipt;

  INSERT INTO public.billing_receipts (
    id,
    invoice_id,
    uploaded_by,
    receipt_storage_path,
    amount_paid,
    status
  )
  VALUES (
    v_tour_receipt,
    v_tour_invoice,
    v_parent,
    v_tour_receipt_path,
    100,
    'pending_approval'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    invoice_id = EXCLUDED.invoice_id,
    uploaded_by = EXCLUDED.uploaded_by,
    receipt_storage_path = EXCLUDED.receipt_storage_path,
    amount_paid = 100,
    status = 'pending_approval',
    rejection_reason_code = NULL,
    rejection_detail = NULL;
END $$;

DROP FUNCTION IF EXISTS public._e2e_upsert_user(text, text, public.user_role, text, text, text);
