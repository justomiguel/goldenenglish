-- Liora Studio landing fits phone screens and behaves like an app on mobile and in the installed PWA.

insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'liora-mobile-native', '2026-11-10', 'site',
  'Liora Studio se ve como app en el celular',
  'Liora Studio feels like an app on phones',
  'Liora Studio parece um app no celular',
  'En el celular, la portada cabe en la pantalla, muestra el botón de reserva al entrar, el próximo evento va dentro de la página y las clases y la galería se deslizan con el dedo.',
  'On phones, the home page fits the screen, shows the booking button on arrival, puts the next event inside the page, and lets visitors swipe the classes and the gallery.',
  'No celular, a página inicial cabe na tela, mostra o botão de reserva na chegada, coloca o próximo evento dentro da página e permite deslizar as aulas e a galeria.',
  0
) on conflict (id) do nothing;
