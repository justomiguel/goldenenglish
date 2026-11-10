insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'shared-events', '2026-11-10', 'events',
  'Evento compartido entre sitios', 'Shared event across sites', 'Evento partilhado entre sites',
  'El sitio dueño puede pedir que otro sitio muestre y gestione el mismo evento. CentroListo aprueba la solicitud.',
  'The owner site can ask another site to show and manage the same event. CentroListo approves the request.',
  'O site dono pode pedir que outro site mostre e gira o mesmo evento. O CentroListo aprova o pedido.',
  0
) on conflict (id) do nothing;
