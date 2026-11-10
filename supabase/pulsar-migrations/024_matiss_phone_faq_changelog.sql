-- Families open a Matiss question and read the answer under that question.

insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'matiss-phone-faq', '2026-11-10', 'site',
  'La respuesta queda bajo la pregunta',
  'The answer sits under the question',
  'A resposta fica sob a pergunta',
  'En el teléfono, cada pregunta de Matiss muestra una flecha. La respuesta se abre debajo de esa pregunta.',
  'On a phone, each Matiss question shows an arrow. The answer opens under that question.',
  'No telefone, cada pergunta da Matiss mostra uma seta. A resposta abre sob essa pergunta.',
  0
) on conflict (id) do nothing;
