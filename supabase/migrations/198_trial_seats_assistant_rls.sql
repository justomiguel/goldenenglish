-- Assistants mark trial visitors the same way they mark enrolled attendance.

BEGIN;

DROP POLICY IF EXISTS registration_trial_seats_teacher_select ON public.registration_trial_seats;
CREATE POLICY registration_trial_seats_teacher_select
  ON public.registration_trial_seats
  FOR SELECT
  TO authenticated
  USING (public.user_leads_or_assists_section(auth.uid(), section_id));

DROP POLICY IF EXISTS registration_trial_seats_teacher_update ON public.registration_trial_seats;
CREATE POLICY registration_trial_seats_teacher_update
  ON public.registration_trial_seats
  FOR UPDATE
  TO authenticated
  USING (public.user_leads_or_assists_section(auth.uid(), section_id))
  WITH CHECK (public.user_leads_or_assists_section(auth.uid(), section_id));

COMMIT;
