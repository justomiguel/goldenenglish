-- Centro Listo GA4 measurement id. Staff edit it in Pulsar admin.
-- Empty stays null so the public tag stays off. No deploy is required.

alter table public.platform_settings
  add column if not exists ga_measurement_id text;

alter table public.platform_settings
  drop constraint if exists platform_settings_ga_measurement_id_check;

alter table public.platform_settings
  add constraint platform_settings_ga_measurement_id_check
  check (ga_measurement_id is null or ga_measurement_id ~ '^G-[A-Z0-9]+$');
