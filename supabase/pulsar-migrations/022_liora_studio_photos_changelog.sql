-- Families see the Liora landing with studio photos and class videos.

insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'liora-studio-photos', '2026-11-10', 'site',
  'La portada de Liora muestra fotos del estudio',
  'The Liora landing shows studio photos',
  'A página da Liora mostra fotos do estúdio',
  'Las fotos de la portada y la galería son del estudio. La galería también reproduce seis videos de clase.',
  'The landing photos and the gallery are from the studio. The gallery also plays six class videos.',
  'As fotos da página e a galeria são do estúdio. A galeria também reproduz seis vídeos de aula.',
  0
) on conflict (id) do nothing;
