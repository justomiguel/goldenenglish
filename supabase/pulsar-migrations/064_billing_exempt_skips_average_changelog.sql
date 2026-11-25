insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'billing-exempt-skips-average', '2026-11-25', 'finance',
  'Un mes exento ya no baja la cuota del plan',
  'An exempt month no longer lowers the plan fee',
  'Um mês isento já não baixa a mensalidade do plano',
  'La cuota tachada aparece solo cuando hay una beca. Un mes exento deja el precio del plan.',
  'The struck fee shows only when a scholarship applies. An exempt month keeps the plan price.',
  'A mensalidade riscada aparece só quando há uma bolsa. Um mês isento mantém o preço do plano.',
  0
) on conflict (id) do nothing;
