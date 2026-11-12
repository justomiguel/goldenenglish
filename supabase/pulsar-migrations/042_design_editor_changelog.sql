insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'design-editor', '2026-11-12', 'cms',
  'Editor de diseño por instituto',
  'Design editor per institute',
  'Editor de desenho por instituto',
  'Editas tokens, secciones y una vista previa. El cambio queda en ese instituto.',
  'You edit tokens, sections, and a preview. The change stays on that institute.',
  'Você edita tokens, seções e uma prévia. A mudança fica nesse instituto.',
  0
) on conflict (id) do nothing;
