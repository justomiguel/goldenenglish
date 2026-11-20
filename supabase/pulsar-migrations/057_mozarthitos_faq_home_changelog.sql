insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'mozarthitos-faq-home', '2026-11-20', 'admin',
  'Preguntas que abren las familias',
  'Questions families open',
  'Perguntas que as famílias abrem',
  'El inicio del admin muestra cuántas personas ven las preguntas y cuál abren.',
  'The admin home shows how many people see the questions and which one they open.',
  'O início do admin mostra quantas pessoas veem as perguntas e qual elas abrem.',
  0
) on conflict (id) do nothing;
