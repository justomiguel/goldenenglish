-- Institute-wide admin Messages default reply templates (es / en / pt).
-- Placeholders: {{instituteName}}, {{phone}}. See spec 2026-07-12-admin-messages-default-reply-design.
-- Idempotent: inserts the seed, or upgrades a legacy single-string row without wiping custom text.

INSERT INTO public.site_settings (key, value, updated_at)
VALUES (
  'messaging_default_reply_template',
  jsonb_build_object(
    'templates',
    jsonb_build_object(
      'es',
      'Gracias por comunicarte con {{instituteName}}. Nos estaremos comunicando contigo a la brevedad. Para urgencias llamar al {{phone}}.',
      'en',
      'Thanks for contacting {{instituteName}}. We will get back to you shortly. For emergencies call {{phone}}.',
      'pt',
      'Obrigado por entrar em contato com {{instituteName}}. Retornaremos em breve. Para urgências, ligue para {{phone}}.'
    )
  ),
  now()
)
ON CONFLICT (key) DO UPDATE
SET
  value = jsonb_build_object(
    'templates',
    jsonb_build_object(
      'es',
      COALESCE(
        NULLIF(
          trim(
            both
            FROM COALESCE(
              public.site_settings.value #>> '{templates,es}',
              public.site_settings.value #>> '{es}',
              public.site_settings.value #>> '{template}',
              ''
            )
          ),
          ''
        ),
        EXCLUDED.value #>> '{templates,es}'
      ),
      'en',
      COALESCE(
        NULLIF(
          trim(
            both
            FROM COALESCE(
              public.site_settings.value #>> '{templates,en}',
              public.site_settings.value #>> '{en}',
              public.site_settings.value #>> '{template}',
              ''
            )
          ),
          ''
        ),
        EXCLUDED.value #>> '{templates,en}'
      ),
      'pt',
      COALESCE(
        NULLIF(
          trim(
            both
            FROM COALESCE(
              public.site_settings.value #>> '{templates,pt}',
              public.site_settings.value #>> '{pt}',
              public.site_settings.value #>> '{template}',
              ''
            )
          ),
          ''
        ),
        EXCLUDED.value #>> '{templates,pt}'
      )
    )
  ),
  updated_at = now();
