insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'cash-matrix-refresh', '2026-11-12', 'finance',
  'La matriz muestra el pago en efectivo',
  'The matrix shows the cash payment',
  'A matriz mostra o pagamento em dinheiro',
  'Después de registrar un pago en efectivo, ese mes queda pagado en la misma pantalla. Si no se guardó ninguna fila, el aviso trae el código save_failed.',
  'After you record a cash payment, that month shows as paid on the same screen. If the save changes no row, the notice includes the code save_failed.',
  'Depois de registrar um pagamento em dinheiro, esse mês fica pago na mesma tela. Se nenhuma linha foi salva, o aviso traz o código save_failed.',
  0
) on conflict (id) do nothing;
