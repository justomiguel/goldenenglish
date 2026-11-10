-- Private transit bucket for institute backup files.
-- The downloaded .cbk is the backup. A cron deletes objects older than 7 days.
insert into storage.buckets (id, name, public)
values ('institute-backups', 'institute-backups', false)
on conflict (id) do update set public = false;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'institute_backups_service_all'
  ) then
    create policy institute_backups_service_all
      on storage.objects
      for all
      to service_role
      using (bucket_id = 'institute-backups')
      with check (bucket_id = 'institute-backups');
  end if;
end $$;
