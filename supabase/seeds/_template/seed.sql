-- Seed opcional por tenant (copiar fuera de `_template` y personalizar).
-- Reemplaza TENANT_SLUG y TENANT_DISPLAY_NAME antes de ejecutar.
--
-- Idempotente: ON CONFLICT (slug) actualiza name, template_kind, properties,
-- content, blocks e is_active (no toca is_system_default ni updated_by).

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
  'TENANT_SLUG',
  'TENANT_DISPLAY_NAME',
  FALSE,
  'classic'::public.site_theme_kind,
  -- TODO: overrides de tokens (alinear con system.properties / CMS).
  jsonb_build_object(
    'color.primary', '#000000',
    'color.secondary', '#000000',
    'color.background', '#FFFFFF',
    'color.surface', '#F8FAFC',
    'color.muted', '#E2E8F0',
    'color.foreground', '#0F172A',
    'layout.border-radius', '8px'
  ),
  -- TODO: overrides de copy de landing por sección + locale (vacío = diccionarios).
  '{}'::jsonb,
  -- TODO: bloques dinámicos (array JSON validado por sanitizeLandingBlocksForPersistence).
  '[]'::jsonb,
  FALSE
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  template_kind = EXCLUDED.template_kind,
  properties = EXCLUDED.properties,
  content = EXCLUDED.content,
  blocks = EXCLUDED.blocks,
  updated_at = now();

-- Si este tema debe quedar como único activo, ejecutar junto con el INSERT (misma sesión):
--
-- UPDATE public.site_themes SET is_active = FALSE WHERE slug <> 'TENANT_SLUG';
-- UPDATE public.site_themes SET is_active = TRUE WHERE slug = 'TENANT_SLUG';
