insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'register-extras-setting', '2026-11-11', 'registrations',
  'Las preguntas extra del formulario viven en un ajuste',
  'Extra form questions live in a setting',
  'As perguntas extras do formulário ficam num ajuste',
  'Eliges ninguna, uniforme y salud, o la guía de clase. El formulario ya no sigue el tema.',
  'You choose none, uniform and health, or the family class guide. The form no longer follows the theme.',
  'Você escolhe nenhuma, uniforme e saúde, ou o guia de aula. O formulário já não segue o tema.',
  0
) on conflict (id) do nothing;
