insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'birthday-avatar-signed-url', '2026-11-10', 'admin',
  'Fotos en cumpleaños del inicio',
  'Photos on home birthdays',
  'Fotos nos aniversários do início',
  'El inicio muestra la foto de cada persona en la lista de cumpleaños.',
  'Home shows each person photo on the birthday list.',
  'O início mostra a foto de cada pessoa na lista de aniversários.',
  0
) on conflict (id) do nothing;
