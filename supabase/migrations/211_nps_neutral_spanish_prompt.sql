-- Databases that already ran 205 stored the Argentine prompt "imaginás".
-- Fresh installs seed the neutral sentence and this update matches zero rows.
UPDATE public.questionnaire_questions
SET prompt_i18n = jsonb_set(
  prompt_i18n,
  '{es}',
  to_jsonb('¿Cómo te imaginas una experiencia online de este instituto?'::text)
)
WHERE prompt_i18n->>'es' = '¿Cómo te imaginás una experiencia online de este instituto?';
