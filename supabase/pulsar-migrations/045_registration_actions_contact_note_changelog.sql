insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'registration-actions-contact-note', '2026-11-12', 'registrations',
  'El popup de Acciones explica el mail y WhatsApp',
  'The Actions popup explains mail and WhatsApp',
  'O popup de Ações explica o e-mail e o WhatsApp',
  'Enviar mail sale desde esta página. WhatsApp abre la aplicación. Editar y eliminar quedan en una fila, y el cierre queda solo en el encabezado.',
  'Send a mail leaves from this page. WhatsApp opens the app. Edit and delete sit on one row, and close stays only in the header.',
  'Enviar e-mail sai desta página. O WhatsApp abre o aplicativo. Editar e eliminar ficam em uma linha, e fechar fica só no cabeçalho.',
  0
) on conflict (id) do nothing;
