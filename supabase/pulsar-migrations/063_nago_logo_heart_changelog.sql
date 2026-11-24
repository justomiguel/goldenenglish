insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'nago-logo-heart', '2026-11-24', 'site',
  'El logo de Nagô ya no muestra el corazón',
  'The Nagô logo no longer shows the heart',
  'O logo da Nagô já não mostra o coração',
  'El corazón amarillo entre Mestre y Fagulha ya no está.',
  'The yellow heart between Mestre and Fagulha is gone.',
  'O coração amarelo entre Mestre e Fagulha já não está.',
  0
) on conflict (id) do nothing;
