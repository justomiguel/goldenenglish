insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'registration-funnel-stages', '2026-11-10', 'registrations',
  'Etapas en Inscripciones',
  'Stages on Registrations',
  'Etapas em Inscrições',
  'Inscripciones muestra cada lead por etapa, desde el contacto hasta la matrícula y luego la sección.',
  'Registrations shows each lead by stage, from contact to matrícula and then to a section.',
  'Inscrições mostra cada lead por etapa, do contacto à matrícula e depois à turma.',
  0
) on conflict (id) do nothing;
