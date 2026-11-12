insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'registration-funnel-batch', '2026-11-11', 'registrations',
  'Lote elegido en el embudo de Inscripciones',
  'Chosen batch on the Registrations funnel',
  'Lote escolhido no funil de Inscrições',
  'Cada etapa se distingue. Puedes marcar filas de la página y contactarlas o devolverlas un paso juntas.',
  'Each stage is distinct. You can mark rows on the page and contact them or step them back together.',
  'Cada etapa se distingue. Você pode marcar linhas da página e contactá-las ou voltá-las um passo juntas.',
  0
) on conflict (id) do nothing;
