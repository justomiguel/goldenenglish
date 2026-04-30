-- Runtime theming + landing CMS
-- Modelo: cada `site_themes` row es un "template" (default, navidad, aniversario...).
-- Solo uno puede estar `is_active = true` a la vez (índice parcial UNIQUE).
-- `properties` JSONB sobreescribe claves de `system.properties` (color.*, layout.*, shadow.*, app.*, contact.*).
-- `content` JSONB guarda overrides de copy de landing por sección (ES + EN).
-- `site_theme_media` guarda imágenes por sección + posición; storage en bucket `landing-media`.
-- Lectura del tema activo: pública (anon + authenticated). Escritura: admin.

-- site_themes ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  archived_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT site_themes_archived_not_active
    CHECK (archived_at IS NULL OR is_active = FALSE)
);

COMMENT ON TABLE public.site_themes IS
  'Runtime theming / landing CMS templates. Up to one row may have is_active = true.';

COMMENT ON COLUMN public.site_themes.properties IS
  'JSONB map of system.properties overrides (e.g. {"color.primary":"#000"}). Defaults from system.properties.';

COMMENT ON COLUMN public.site_themes.content IS
  'JSONB map of landing copy overrides by section + locale. Defaults from src/dictionaries/*.json.';

CREATE UNIQUE INDEX IF NOT EXISTS site_themes_only_one_active
  ON public.site_themes (is_active)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS site_themes_admin_list_idx
  ON public.site_themes (archived_at NULLS FIRST, is_active DESC, created_at DESC);

-- updated_at trigger --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.site_themes_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS site_themes_set_updated_at ON public.site_themes;
CREATE TRIGGER site_themes_set_updated_at
  BEFORE UPDATE ON public.site_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.site_themes_set_updated_at();

-- site_theme_media ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_theme_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL REFERENCES public.site_themes (id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  position INT NOT NULL DEFAULT 1,
  storage_path TEXT NOT NULL,
  alt_es TEXT NULL,
  alt_en TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (theme_id, section, position)
);

COMMENT ON TABLE public.site_theme_media IS
  'Images per landing section (inicio, historia, modalidades, niveles, certificaciones, oferta). Shared ES/EN in v1.';

CREATE INDEX IF NOT EXISTS site_theme_media_theme_section_idx
  ON public.site_theme_media (theme_id, section);

-- RLS -----------------------------------------------------------------------
ALTER TABLE public.site_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_theme_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_themes_select_active ON public.site_themes;
CREATE POLICY site_themes_select_active
  ON public.site_themes FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS site_themes_select_admin ON public.site_themes;
CREATE POLICY site_themes_select_admin
  ON public.site_themes FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS site_themes_all_admin ON public.site_themes;
CREATE POLICY site_themes_all_admin
  ON public.site_themes FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS site_theme_media_select_active ON public.site_theme_media;
CREATE POLICY site_theme_media_select_active
  ON public.site_theme_media FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.site_themes t
      WHERE t.id = site_theme_media.theme_id AND t.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS site_theme_media_select_admin ON public.site_theme_media;
CREATE POLICY site_theme_media_select_admin
  ON public.site_theme_media FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS site_theme_media_all_admin ON public.site_theme_media;
CREATE POLICY site_theme_media_all_admin
  ON public.site_theme_media FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Storage bucket: landing-media (público RO, escritura admin) ---------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-media', 'landing-media', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS landing_media_select_public ON storage.objects;
CREATE POLICY landing_media_select_public
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'landing-media');

DROP POLICY IF EXISTS landing_media_insert_admin ON storage.objects;
CREATE POLICY landing_media_insert_admin
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'landing-media'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS landing_media_update_admin ON storage.objects;
CREATE POLICY landing_media_update_admin
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'landing-media'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS landing_media_delete_admin ON storage.objects;
CREATE POLICY landing_media_delete_admin
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'landing-media'
    AND public.is_admin(auth.uid())
  );
