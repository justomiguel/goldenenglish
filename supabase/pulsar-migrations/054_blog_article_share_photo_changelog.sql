insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'blog-article-share-photo', '2026-11-14', 'cms',
  'Foto del artículo al compartir',
  'Article photo on share',
  'Foto do artigo ao partilhar',
  'La vista previa de un artículo del blog usa la primera foto de ese artículo.',
  'The link preview of a blog article uses the first photo of that article.',
  'A pré-visualização de um artigo do blog usa a primeira foto desse artigo.',
  0
) on conflict (id) do nothing;
