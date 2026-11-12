insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'public-chrome-tokens', '2026-11-12', 'site',
  'La barra y el encabezado siguen al instituto',
  'The bar and the header follow the institute',
  'A barra e o cabeçalho seguem o instituto',
  'En Matiss la barra inferior usa los colores del tema. En Nagô el encabezado ya no deja un hueco extra.',
  'On Matiss the bottom bar uses the theme colors. On Nagô the header no longer leaves an extra gap.',
  'No Matiss a barra inferior usa as cores do tema. No Nagô o cabeçalho já não deixa um vão extra.',
  0
) on conflict (id) do nothing;
