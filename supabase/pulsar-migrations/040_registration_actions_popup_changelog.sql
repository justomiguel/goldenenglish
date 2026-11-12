insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'registration-actions-popup', '2026-11-11', 'registrations',
  'La acción de la etapa queda sola en Acciones',
  'The stage action stands alone in Actions',
  'A ação da etapa fica sozinha em Ações',
  'El popup muestra la frase del paso y un solo botón. Editar, borrar y volver quedan debajo.',
  'The popup shows the step sentence and one button. Edit, delete, and back sit below it.',
  'O popup mostra a frase do passo e um só botão. Editar, apagar e voltar ficam abaixo.',
  0
) on conflict (id) do nothing;
