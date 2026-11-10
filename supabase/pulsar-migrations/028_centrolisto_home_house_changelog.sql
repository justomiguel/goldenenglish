-- The CentroListo home opens on a school site and follows one list.

insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'centrolisto-home-house', '2026-11-10', 'site',
  'La portada abre en el sitio de una academia',
  'The home opens on an academy site',
  'A página abre no site de uma academia',
  'La portada de CentroListo abre en el sitio de una escuela y sigue una lista hasta la inscripción y el cobro.',
  'The CentroListo home opens on a school site and follows one list through enrollment and the monthly charge.',
  'A página do CentroListo abre no site de uma escola e segue uma lista até a inscrição e a cobrança.',
  0
) on conflict (id) do nothing;
