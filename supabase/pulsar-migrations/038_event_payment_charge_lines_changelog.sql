insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'event-payment-ticket-lines', '2026-11-11', 'events',
  'Detalle de entradas en cada pago',
  'Ticket lines on every payment',
  'Detalhe de entradas em cada pagamento',
  'Cada pago del evento muestra cuántas entradas se compraron y a qué precio.',
  'Each event payment shows how many tickets were bought and at what price.',
  'Cada pagamento do evento mostra quantas entradas foram compradas e a que preço.',
  0
) on conflict (id) do nothing;
