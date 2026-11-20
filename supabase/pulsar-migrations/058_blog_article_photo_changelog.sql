insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'blog-article-photo-whole', '2026-11-20', 'cms',
  'Foto completa en la nota',
  'Whole photo on a note',
  'Foto inteira na nota',
  'La foto de una nota se ve entera y centrada, en la tarjeta y en la página.',
  'A note photo stays whole and centered, on the card and on the page.',
  'A foto de uma nota fica inteira e centrada, no cartão e na página.',
  2
) on conflict (id) do nothing;
