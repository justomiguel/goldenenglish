insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'academic-hub-two-cohort-tabs', '2026-11-14', 'academic',
  'Cohortes en dos pestañas',
  'Cohorts use two tabs',
  'Coortes em duas abas',
  'En Cohortes y secciones, Activas muestra primero la vigente y debajo el resto. Archivadas queda en la otra pestaña.',
  'On Cohorts and sections, Active shows the current cohort first and the others below. Archived stays on the other tab.',
  'Em Coortes e seções, Ativas mostra primeiro a atual e as outras abaixo. Arquivadas fica na outra aba.',
  0
) on conflict (id) do nothing;
