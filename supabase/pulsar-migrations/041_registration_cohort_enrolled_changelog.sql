insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'registration-cohort-enrolled', '2026-11-12', 'registrations',
  'Inscripciones se mira por cohorte',
  'Registrations can be read one cohort at a time',
  'As inscrições podem ser lidas por turma',
  'La lista tiene un selector de cohorte. Pre-inscritos es la primera flecha e Inscritos muestra la sección.',
  'The list has a cohort selector. Pre-enrolled is the first arrow and Enrolled in a section shows the section.',
  'A lista tem um seletor de turma. Pré-inscritos é a primeira flecha e Inscritos mostra a turma.',
  0
) on conflict (id) do nothing;
