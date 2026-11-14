insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'academic-hub-courses-entry', '2026-11-14', 'academic',
  'Cursos abre el año vigente en Secciones', 'Courses opens the current year on Sections', 'Cursos abre o ano vigente em Seções',
  'El menú dice Cursos y abre el año vigente en una tabla de secciones con profesores y horarios.',
  'The menu says Courses and opens the current year as a section table with teachers and schedules.',
  'O menu diz Cursos e abre o ano vigente numa tabela de seções com professores e horários.',
  0
) on conflict (id) do nothing;
