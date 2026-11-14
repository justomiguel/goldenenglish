insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'section-move-carry', '2026-11-14', 'academic',
  'Al mover un alumno eliges qué acuerdos lo siguen',
  'A section move asks which agreements follow',
  'Ao mover um aluno escolhe que acordos o seguem',
  'Al mover un alumno, eliges si pagos, becas, matrícula y el cierre anual pasan a la sección nueva.',
  'When you move a student, you choose whether payments, scholarships, the enrollment fee, and the annual settlement follow.',
  'Ao mover um aluno, escolhe se pagamentos, bolsas, matrícula e o fecho anual passam para a turma nova.',
  0
) on conflict (id) do nothing;
