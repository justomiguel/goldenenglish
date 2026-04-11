-- Allow admins to delete registration rows (e.g. spam or processed elsewhere).
DROP POLICY IF EXISTS registrations_delete_admin ON public.registrations;
CREATE POLICY registrations_delete_admin
  ON public.registrations FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));
