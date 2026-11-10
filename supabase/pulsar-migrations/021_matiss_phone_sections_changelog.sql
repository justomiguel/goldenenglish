-- Families see the Matiss phone landing as one screen per section.

insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'matiss-phone-sections', '2026-11-10', 'site',
  'La portada de Matiss cabe en el teléfono',
  'The Matiss landing fits the phone',
  'A página da Matiss cabe no telefone',
  'En el teléfono cada sección ocupa una pantalla. Una foto de la galería abre el carrusel.',
  'On a phone, each section fills one screen. A gallery photo opens the carousel.',
  'No telefone, cada seção ocupa uma tela. Uma foto da galeria abre o carrossel.',
  0
) on conflict (id) do nothing;
