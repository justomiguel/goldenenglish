-- Initial site setup flag (greenfield wizard). Value: { "completedAt": "<ISO>" | null }
-- Existing deployments (users or CMS data) are marked completed so upgrades are not blocked.

INSERT INTO public.site_settings (key, value)
VALUES ('initial_site_setup', '{"completedAt":null}'::jsonb)
ON CONFLICT (key) DO NOTHING;

UPDATE public.site_settings ss
SET value = jsonb_set(ss.value, '{completedAt}', to_jsonb(now()::text), true)
WHERE ss.key = 'initial_site_setup'
  AND (ss.value->>'completedAt') IS NULL
  AND (
    EXISTS (SELECT 1 FROM public.site_theme_media LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM public.site_themes st
      WHERE st.is_active = TRUE
        AND st.archived_at IS NULL
        AND st.properties IS NOT NULL
        AND st.properties <> '{}'::jsonb
    )
    OR EXISTS (SELECT 1 FROM auth.users LIMIT 1)
  );
