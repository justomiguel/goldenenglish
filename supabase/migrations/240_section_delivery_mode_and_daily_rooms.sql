alter table public.academic_sections
  add column if not exists delivery_mode text not null default 'in_person';

alter table public.academic_sections
  drop constraint if exists academic_sections_delivery_mode_check;

alter table public.academic_sections
  add constraint academic_sections_delivery_mode_check
  check (delivery_mode in ('in_person', 'hybrid', 'remote'));

create table if not exists public.section_daily_rooms (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.academic_sections (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time text not null,
  daily_room_name text not null,
  daily_room_url text not null,
  created_at timestamptz not null default now(),
  unique (section_id, day_of_week, start_time)
);

alter table public.section_daily_rooms enable row level security;

revoke all on table public.section_daily_rooms from public, anon, authenticated;
