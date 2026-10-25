-- Additive for a Pulsar database that already ran 001 without this column.

alter table public.platform_staff
  add column if not exists must_change_password boolean not null default false;
