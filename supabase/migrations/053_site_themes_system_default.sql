-- PR 8: convertir el "Tema por defecto" en una fila real de site_themes,
-- editable desde el CMS igual que cualquier otro template.
--
-- Antes: el grid de admin renderizaba un card "virtual" leyendo solo
-- `system.properties`, pero los textos / properties / blocks de ese tema no se
-- podían modificar desde la UI (no había row donde guardar overrides).
-- Después: existe siempre un row con slug='default' marcado
-- `is_system_default = true`, que arranca con `properties = {}` y `content = {}`
-- (=> hereda `system.properties` y los diccionarios), y cualquier admin puede
-- editar tokens, copy de landing, hero o blocks como con los demás templates.
-- Las server actions bloquean archivar/borrar el system default para garantizar
-- que siempre haya un fallback consistente.
--
-- Idempotente:
-- - ADD COLUMN ... IF NOT EXISTS
-- - índice parcial UNIQUE para que como mucho exista UN system default
-- - INSERT ... ON CONFLICT (slug) actualiza el flag si alguien ya tenía un
--   row con slug='default' creado a mano
-- - si no hay ningún row activo todavía, activa el system default

-- 1) Columna -----------------------------------------------------------------
ALTER TABLE public.site_themes
  ADD COLUMN IF NOT EXISTS is_system_default BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.site_themes.is_system_default IS
  'Marca el row "Tema por defecto" del sistema. Solo uno puede tener TRUE. Las server actions impiden archivarlo o borrarlo para garantizar fallback consistente.';

-- 2) A lo más un system default -------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS site_themes_only_one_system_default
  ON public.site_themes (is_system_default)
  WHERE is_system_default = TRUE;

-- 3) Seed idempotente del row default ---------------------------------------
-- Si alguien ya creó manualmente un row con slug='default' (poco probable,
-- pero posible), lo promovemos a system default sin pisar properties/content.
INSERT INTO public.site_themes (
  slug,
  name,
  is_active,
  template_kind,
  properties,
  content,
  blocks,
  is_system_default
)
VALUES (
  'default',
  'Tema por defecto',
  FALSE,
  'classic'::public.site_theme_kind,
  '{}'::jsonb,
  '{}'::jsonb,
  '[]'::jsonb,
  TRUE
)
ON CONFLICT (slug) DO UPDATE
  SET is_system_default = TRUE;

-- 4) Garantizar que siempre haya un activo ----------------------------------
-- Si no había ningún row con `is_active = true` antes de esta migración, el
-- system default toma el rol del tema activo (el sitio público sigue pintando
-- exactamente igual porque properties/content están vacíos).
UPDATE public.site_themes
SET is_active = TRUE
WHERE is_system_default = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM public.site_themes WHERE is_active = TRUE
  );
