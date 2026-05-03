-- Backfill for deployments that ran an older migration adding enum label `espaciozenith`
-- and row slug `espaciozenith`. The app + seeds now use `espaciozenit`.
--
-- Requires migration `101_ensure_site_theme_kind_espaciozenit_enum.sql` applied first
-- so `'espaciozenit'::site_theme_kind` exists (cannot ADDVALUE + UPDATE in same transaction).
--
-- Idempotent when slugs / rows are already migrated.

-- 1) Any theme row still stored with retired template_kind label.
UPDATE public.site_themes st
SET template_kind = 'espaciozenit'::public.site_theme_kind
WHERE st.template_kind IS NOT NULL
  AND st.template_kind::text = 'espaciozenith';

-- 2) Rename slug when there is no row yet at `espaciozenit`.
UPDATE public.site_themes st
SET
  slug = 'espaciozenit',
  name = 'Espacio Zenit',
  properties = replace(
    replace(st.properties::text, '/images/espaciozenith/', '/images/espaciozenit/'),
    'espaciozenith.example',
    'espaciozenit.example'
  )::jsonb,
  template_kind = 'espaciozenit'::public.site_theme_kind
WHERE st.slug = 'espaciozenith'
  AND NOT EXISTS (
    SELECT 1 FROM public.site_themes z WHERE z.slug = 'espaciozenit'
  );

-- 3) Repair canonical `espaciozenit` row (paths / display name).
UPDATE public.site_themes st
SET
  template_kind = 'espaciozenit'::public.site_theme_kind,
  properties = replace(
    replace(st.properties::text, '/images/espaciozenith/', '/images/espaciozenit/'),
    'espaciozenith.example',
    'espaciozenit.example'
  )::jsonb,
  name = CASE WHEN st.name ILIKE '%zenith%' THEN 'Espacio Zenit' ELSE st.name END
WHERE st.slug = 'espaciozenit'
  AND (
    st.template_kind::text = 'espaciozenith'
    OR st.properties::text LIKE '%espaciozenith%'
    OR st.name ILIKE '%zenith%'
  );

-- 4) If BOTH slugs existed (seed 100 + legacy row): move media onto `espaciozenit`, merge flags, drop legacy row.
DO $$
DECLARE
  id_legacy uuid := (SELECT id FROM public.site_themes WHERE slug = 'espaciozenith' LIMIT 1);
  id_canon uuid := (SELECT id FROM public.site_themes WHERE slug = 'espaciozenit' LIMIT 1);
  merged_active boolean;
BEGIN
  IF id_legacy IS NULL OR id_canon IS NULL OR id_legacy = id_canon THEN
    RETURN;
  END IF;

  -- Snapshot before toggling rows: UNIQUE (is_active) WHERE is_active only allows one true row globally.
  -- Setting canon active while legacy is still active causes 23505.
  SELECT canon.is_active OR leg.is_active
  INTO merged_active
  FROM public.site_themes canon
  INNER JOIN public.site_themes leg ON leg.id = id_legacy
  WHERE canon.id = id_canon;

  UPDATE public.site_themes
  SET is_active = FALSE
  WHERE id IN (id_canon, id_legacy);

  UPDATE public.site_themes canon
  SET
    is_active = merged_active,
    content = CASE
      WHEN leg.content <> '{}'::jsonb AND canon.content = '{}'::jsonb THEN leg.content
      ELSE canon.content
    END,
    properties = CASE
      WHEN length(leg.properties::text) > length(canon.properties::text) THEN leg.properties
      ELSE canon.properties
    END,
    name = CASE WHEN canon.name ILIKE '%zenith%' THEN 'Espacio Zenit' ELSE canon.name END
  FROM public.site_themes leg
  WHERE canon.id = id_canon
    AND leg.id = id_legacy;

  UPDATE public.site_themes canon
  SET
    properties = replace(
      replace(canon.properties::text, '/images/espaciozenith/', '/images/espaciozenit/'),
      'espaciozenith.example',
      'espaciozenit.example'
    )::jsonb,
    name = CASE WHEN canon.name ILIKE '%zenith%' THEN 'Espacio Zenit' ELSE canon.name END
  WHERE canon.id = id_canon
    AND (
      canon.properties::text LIKE '%espaciozenith%'
      OR canon.name ILIKE '%zenith%'
    );

  DELETE FROM public.site_theme_media n
  USING public.site_theme_media o
  WHERE n.theme_id = id_canon
    AND o.theme_id = id_legacy
    AND n.section = o.section
    AND n.position = o.position;

  UPDATE public.site_theme_media
  SET theme_id = id_canon
  WHERE theme_id = id_legacy;

  DELETE FROM public.site_themes WHERE id = id_legacy;
END $$;

-- 5) Stored object paths referencing old folder name (landing-media rows).
UPDATE public.site_theme_media
SET storage_path = replace(storage_path, 'espaciozenith', 'espaciozenit')
WHERE storage_path LIKE '%espaciozenith%';
