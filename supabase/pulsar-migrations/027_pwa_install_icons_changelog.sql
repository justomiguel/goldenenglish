-- Each institute host can be installed. The manifest lists 192 and 512 icons.

insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'pwa-install-icons', '2026-11-10', 'site',
  'La app del instituto se puede instalar',
  'The institute app can be installed',
  'A app do instituto pode ser instalada',
  'El manifiesto trae íconos de 192 y 512. El teléfono puede guardar la app de ese dominio.',
  'The manifest includes 192 and 512 icons. The phone can save the app for that domain.',
  'O manifesto traz ícones de 192 e 512. O telefone pode guardar a app desse domínio.',
  0
) on conflict (id) do nothing;
