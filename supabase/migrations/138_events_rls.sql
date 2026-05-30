BEGIN;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendee_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_payment_flow_finalize_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_payment_mp_finalize_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_select_public_or_admin ON public.events;
CREATE POLICY events_select_public_or_admin ON public.events
  FOR SELECT TO anon, authenticated
  USING (
    (
      status = 'published'
      AND archived_at IS NULL
    )
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS events_modify_admin ON public.events;
CREATE POLICY events_modify_admin ON public.events
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS event_form_fields_select_public_or_admin ON public.event_form_fields;
CREATE POLICY event_form_fields_select_public_or_admin ON public.event_form_fields
  FOR SELECT TO anon, authenticated
  USING (
    (
      archived_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.events e
        WHERE e.id = event_form_fields.event_id
          AND e.status = 'published'
          AND e.archived_at IS NULL
      )
    )
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS event_form_fields_modify_admin ON public.event_form_fields;
CREATE POLICY event_form_fields_modify_admin ON public.event_form_fields
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS event_attendees_select_owner_or_admin ON public.event_attendees;
CREATE POLICY event_attendees_select_owner_or_admin ON public.event_attendees
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR user_id = auth.uid()
    OR tutor_id = auth.uid()
  );

DROP POLICY IF EXISTS event_attendees_modify_admin ON public.event_attendees;
CREATE POLICY event_attendees_modify_admin ON public.event_attendees
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS event_attendee_field_values_select_owner_or_admin ON public.event_attendee_field_values;
CREATE POLICY event_attendee_field_values_select_owner_or_admin ON public.event_attendee_field_values
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.event_attendees a
      WHERE a.id = event_attendee_field_values.attendee_id
        AND (
          public.is_admin(auth.uid())
          OR a.user_id = auth.uid()
          OR a.tutor_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS event_attendee_field_values_modify_admin ON public.event_attendee_field_values;
CREATE POLICY event_attendee_field_values_modify_admin ON public.event_attendee_field_values
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS event_payments_select_owner_or_admin ON public.event_payments;
CREATE POLICY event_payments_select_owner_or_admin ON public.event_payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.event_attendees a
      WHERE a.id = event_payments.event_attendee_id
        AND (
          public.is_admin(auth.uid())
          OR a.user_id = auth.uid()
          OR a.tutor_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS event_payments_modify_admin ON public.event_payments;
CREATE POLICY event_payments_modify_admin ON public.event_payments
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS event_payment_flow_finalize_records_select_owner_or_admin ON public.event_payment_flow_finalize_records;
CREATE POLICY event_payment_flow_finalize_records_select_owner_or_admin ON public.event_payment_flow_finalize_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.event_payments ep
      JOIN public.event_attendees a ON a.id = ep.event_attendee_id
      WHERE ep.id = event_payment_flow_finalize_records.event_payment_id
        AND (
          public.is_admin(auth.uid())
          OR a.user_id = auth.uid()
          OR a.tutor_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS event_payment_mp_finalize_records_select_owner_or_admin ON public.event_payment_mp_finalize_records;
CREATE POLICY event_payment_mp_finalize_records_select_owner_or_admin ON public.event_payment_mp_finalize_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.event_payments ep
      JOIN public.event_attendees a ON a.id = ep.event_attendee_id
      WHERE ep.id = event_payment_mp_finalize_records.event_payment_id
        AND (
          public.is_admin(auth.uid())
          OR a.user_id = auth.uid()
          OR a.tutor_id = auth.uid()
        )
    )
  );

COMMIT;
