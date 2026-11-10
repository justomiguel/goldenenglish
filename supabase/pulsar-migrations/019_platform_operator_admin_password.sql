-- Operator admin password for generated institutes.
-- Staff set it in the CentroListo panel. The column stays null until then.
-- RLS on platform_settings has no anon or authenticated policy. Only service_role reads it.
-- Do not put a password value in this file.

alter table public.platform_settings
  add column if not exists operator_admin_password text;

alter table public.platform_settings
  drop constraint if exists platform_settings_operator_admin_password_check;

alter table public.platform_settings
  add constraint platform_settings_operator_admin_password_check
  check (
    operator_admin_password is null
    or char_length(operator_admin_password) between 8 and 200
  );
