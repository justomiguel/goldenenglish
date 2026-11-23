insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'ai-provider-port', '2026-11-21', 'admin',
  'La conversación no depende del proveedor',
  'Conversation memory does not depend on the provider',
  'A conversa não depende do provedor',
  'Si el proveedor de IA no guarda el hilo, CentroListo lo guarda.',
  'If the AI provider does not keep the thread, CentroListo keeps it.',
  'Se o provedor de IA não guarda o fio, o CentroListo guarda.',
  0
) on conflict (id) do nothing;
