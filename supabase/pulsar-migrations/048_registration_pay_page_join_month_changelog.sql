insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'registration-pay-page-join-month', '2026-11-13', 'registrations',
  'La página de matrícula muestra las tres formas de pago',
  'The matrícula page shows the three payment choices',
  'A página da matrícula mostra as três formas de pagamento',
  'La familia puede avisar un pago en efectivo, pagar online o subir un comprobante. El mes de la cuota al ingresar sale de la cohorte elegida.',
  'A family can report cash, pay online, or upload a receipt. The join-month line uses the selected cohort.',
  'A família pode avisar um pagamento em dinheiro, pagar online ou enviar um comprovante. O mês da mensalidade de ingresso usa a coorte escolhida.',
  0
) on conflict (id) do nothing;
