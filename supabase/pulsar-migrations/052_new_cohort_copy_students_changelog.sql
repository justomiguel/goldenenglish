insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'new-cohort-copy-students', '2026-11-14', 'academic',
  'Nueva cohorte copia alumnos',
  'New cohort copies students',
  'Nova coorte copia alunos',
  'Al crear una cohorte puedes fijar la matrícula y una cuota única por sección, y copiar secciones y alumnos sin sacarlos de la cohorte de origen.',
  'When you create a cohort you can set the matrícula and one monthly fee per section, and copy sections and students without removing them from the source cohort.',
  'Ao criar uma coorte você pode definir a matrícula e uma mensalidade única por seção, e copiar seções e alunos sem tirá-los da coorte de origem.',
  0
) on conflict (id) do nothing;
