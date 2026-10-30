-- Last Pulsar mail attempt. Additive. Does not store the API key.

alter table public.platform_settings
  add column if not exists mail_last_ok boolean,
  add column if not exists mail_last_code text,
  add column if not exists mail_last_detail text,
  add column if not exists mail_last_at timestamptz;
