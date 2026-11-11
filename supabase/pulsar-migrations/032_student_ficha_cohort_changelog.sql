insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'student-ficha-cohort-filter', '2026-11-10', 'academic',
  'Cohorte en la ficha del alumno',
  'Cohort on the student file',
  'Coorte na ficha do aluno',
  'En Académico y en Pagos eliges la cohorte del alumno y ves las secciones y los pagos de esa cohorte.',
  'On Academic and Payments you pick the student cohort and see that cohort sections and payments.',
  'Em Acadêmico e em Pagamentos você escolhe a coorte do aluno e vê as turmas e os pagamentos dessa coorte.',
  0
) on conflict (id) do nothing;
