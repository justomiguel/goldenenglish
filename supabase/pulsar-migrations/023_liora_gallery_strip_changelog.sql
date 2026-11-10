-- Families see the Liora gallery move through every studio photo and video.

insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'liora-gallery-strip', '2026-11-10', 'site',
  'La galería de Liora avanza sola',
  'The Liora gallery advances on its own',
  'A galeria da Liora avança sozinha',
  'La galería recorre las fotos y los videos del estudio. Puedes pausarla.',
  'The gallery moves through the studio photos and videos. You can pause it.',
  'A galeria percorre as fotos e os vídeos do estúdio. Você pode pausá-la.',
  0
) on conflict (id) do nothing;
