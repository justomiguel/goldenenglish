insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'site-setup-font-catalog', '2026-11-11', 'admin',
  'Fuentes del instituto desde un catálogo',
  'Institute fonts from a catalog',
  'Fontes do instituto a partir de um catálogo',
  'Puedes elegir la fuente de títulos y la del texto en la configuración inicial. Una fuente de otro instituto no aparece.',
  'You can pick the heading font and the body font in initial setup. A font owned by another institute stays hidden.',
  'Você pode escolher a fonte dos títulos e a do texto na configuração inicial. Uma fonte de outro instituto não aparece.',
  0
) on conflict (id) do nothing;
