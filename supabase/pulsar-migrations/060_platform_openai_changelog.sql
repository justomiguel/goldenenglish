insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'centrolisto-openai-key', '2026-11-21', 'admin',
  'Clave de OpenAI en Operador',
  'OpenAI key on Operator',
  'Chave da OpenAI em Operador',
  'En Operador puedes guardar la clave de OpenAI. El panel muestra solo los últimos 4.',
  'On Operator you can save the OpenAI key. The panel shows only the last 4.',
  'Em Operador você pode salvar a chave da OpenAI. O painel mostra só os últimos 4.',
  0
) on conflict (id) do nothing;
