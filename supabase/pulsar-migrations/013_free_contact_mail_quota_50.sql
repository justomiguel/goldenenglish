-- Raise the free-site contact form allowance from 25 to 50.
-- Rows a person already changed stay as they are.

alter table public.platform_tenants
  alter column free_contact_mail_quota set default 50;

update public.platform_tenants
set free_contact_mail_quota = 50
where free_contact_mail_quota = 25;
