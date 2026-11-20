insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'mozarthitos-share-image', '2026-11-20', 'site',
  'Imagen al compartir Mozarthitos',
  'Mozarthitos share image',
  'Imagem ao partilhar a Mozarthitos',
  'El enlace de Mozarthitos muestra el logo, la marca y la frase de la academia.',
  'A Mozarthitos link shows the logo, the brand, and the academy phrase.',
  'O link da Mozarthitos mostra o logo, a marca e a frase da academia.',
  1
) on conflict (id) do nothing;
