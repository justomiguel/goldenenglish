insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'cash-matricula-cohort-first', '2026-11-12', 'registrations',
  'El pago en efectivo usa la matrícula de la cohorte',
  'Cash payment uses the cohort matrícula',
  'O pagamento em dinheiro usa a matrícula da coorte',
  'Si la cohorte tiene matrícula, marcar pagado en efectivo guarda ese monto aunque la ficha no tenga sección.',
  'When the cohort has a matrícula, marking a lead paid in cash stores that amount even if the lead has no section.',
  'Se a coorte tem matrícula, marcar pago em dinheiro grava esse valor mesmo que a ficha não tenha turma.',
  0
) on conflict (id) do nothing;
