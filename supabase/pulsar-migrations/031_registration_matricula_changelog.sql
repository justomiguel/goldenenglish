insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'registration-matricula-before-section', '2026-11-10', 'registrations',
  'La matrícula se confirma en Inscripciones',
  'The matrícula is confirmed in Registrations',
  'A matrícula é confirmada em Inscrições',
  'La preinscripción sigue en Inscripciones hasta que confirmas la matrícula y asignas una sección de esa cohorte.',
  'The lead stays in Registrations until you confirm the matrícula and assign a section from that cohort.',
  'A pré-inscrição segue em Inscrições até você confirmar a matrícula e atribuir uma turma dessa coorte.',
  0
) on conflict (id) do nothing;
