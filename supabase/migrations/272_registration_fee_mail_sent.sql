-- Staff matrícula mail stamp. Public insert does not set this column.

alter table public.registrations
  add column if not exists enrollment_fee_mail_sent_at timestamptz;

comment on column public.registrations.enrollment_fee_mail_sent_at is
  'When staff sent the matrícula payment mail. Null until that send.';
