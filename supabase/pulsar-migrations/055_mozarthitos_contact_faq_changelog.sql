insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'mozarthitos-contact-faq', '2026-11-19', 'site',
  'Preguntas frecuentes en el contacto de Mozarthitos',
  'Frequent questions on the Mozarthitos contact',
  'Perguntas frequentes no contato da Mozarthitos',
  'Las familias abren cada respuesta en el contacto y en la página de preguntas.',
  'Families open each answer on the contact block and on the questions page.',
  'As famílias abrem cada resposta no contato e na página de perguntas.',
  0
) on conflict (id) do nothing;
