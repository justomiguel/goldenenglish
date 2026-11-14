insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'registration-funnel-by-cohort-fee', '2026-11-12', 'registrations',
  'El embudo de preinscripciones sigue la matrícula de la cohorte',
  'The registration funnel follows the cohort matrícula',
  'O funil de pré-inscrições segue a matrícula da coorte',
  'Si la cohorte tiene matrícula, el embudo muestra pago y últimos inscritos. Si no tiene, muestra contactados esperando sección e inscritos.',
  'When the cohort has a matrícula, the funnel shows payment and the latest enrolled leads. When it does not, it shows contacted leads waiting for a section and enrolled leads.',
  'Se a coorte tem matrícula, o funil mostra pagamento e os últimos inscritos. Se não tem, mostra contactados à espera de turma e inscritos.',
  0
) on conflict (id) do nothing;
