-- Liora Studio landing uses the Instagram palette, a dancer lockup, and a ribbon that follows the scroll.

insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'liora-instagram-redesign', '2026-11-10', 'site',
  'Nueva portada de Liora Studio',
  'New Liora Studio home page',
  'Nova página inicial da Liora Studio',
  'La portada usa los colores de Instagram del estudio, un logo de bailarina en la cabecera y una cinta rosa que acompaña el recorrido.',
  'The home page uses the studio Instagram colours, a dancer logo in the header, and a rose ribbon that follows the visit.',
  'A página inicial usa as cores do Instagram do estúdio, um logo de bailarina no cabeçalho e uma fita rosa que acompanha a visita.',
  0
) on conflict (id) do nothing;
