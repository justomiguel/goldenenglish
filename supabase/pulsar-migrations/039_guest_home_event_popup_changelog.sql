insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'guest-home-event-popup', '2026-11-11', 'events',
  'El evento compartido también abre en el home invitado',
  'A shared event also opens on the guest home',
  'O evento partilhado também abre no home convidado',
  'Si el evento compartido tiene el aviso del home, ese aviso aparece en el sitio invitado. El menú de Matiss suma Eventos y Blog.',
  'When a shared event is marked for the home, that notice opens on the guest site. The Matiss menu adds Events and Blog.',
  'Quando o evento partilhado está marcado para o home, esse aviso abre no site convidado. O menu da Matiss soma Eventos e Blog.',
  0
) on conflict (id) do nothing;
