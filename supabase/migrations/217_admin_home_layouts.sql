-- One home layout per admin. Other admins cannot read or write this row.

CREATE TABLE IF NOT EXISTS public.admin_home_layouts (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  layout jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_home_layouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_home_layouts_select_own ON public.admin_home_layouts;
CREATE POLICY admin_home_layouts_select_own
  ON public.admin_home_layouts
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() AND public.is_current_user_admin());

DROP POLICY IF EXISTS admin_home_layouts_insert_own ON public.admin_home_layouts;
CREATE POLICY admin_home_layouts_insert_own
  ON public.admin_home_layouts
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid() AND public.is_current_user_admin());

DROP POLICY IF EXISTS admin_home_layouts_update_own ON public.admin_home_layouts;
CREATE POLICY admin_home_layouts_update_own
  ON public.admin_home_layouts
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid() AND public.is_current_user_admin())
  WITH CHECK (profile_id = auth.uid() AND public.is_current_user_admin());

DROP POLICY IF EXISTS admin_home_layouts_delete_own ON public.admin_home_layouts;
CREATE POLICY admin_home_layouts_delete_own
  ON public.admin_home_layouts
  FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid() AND public.is_current_user_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_home_layouts TO authenticated;
