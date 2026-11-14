insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'registration-enrolled-section-label', '2026-11-13', 'registrations',
  'El último estado se llama Inscritos con sección',
  'The last stage reads Enrolled in a section',
  'O último estado chama-se Inscritos com turma',
  'El último paso del embudo de inscripciones ahora se llama Inscritos con sección.',
  'The last registration funnel stage now reads Enrolled in a section.',
  'O último passo do funil de inscrições agora se chama Inscritos com turma.',
  0
) on conflict (id) do nothing;
