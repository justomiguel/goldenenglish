insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'registration-funnel-arrows', '2026-11-10', 'registrations',
  'Flechas y volver un paso en Inscripciones',
  'Arrows and one-step return on Registrations',
  'Setas e voltar um passo em Inscrições',
  'Las etapas se ven como una flecha. Puedes volver un paso y escribir el mail de contacto en el panel.',
  'Stages look like one arrow. You can step back and write the contact mail in the panel.',
  'As etapas parecem uma seta. Você pode voltar um passo e escrever o e-mail de contacto no painel.',
  0
) on conflict (id) do nothing;
