-- Communications: editable email templates per locale.
--
-- Modelo:
--   - El catálogo de `template_key`s vive en código (registry TS), no en BD.
--   - `email_templates` guarda OVERRIDES del admin por (template_key, locale).
--     Si no existe fila, los emisores caen al default del registry y todo el
--     producto sigue funcionando exactamente igual que antes de esta migración.
--   - Layout/branding se aplica en `wrapEmailHtml.ts` (server-only) y NO se
--     persiste aquí: `body_html` es solo el cuerpo (lo que cambia entre emails).
--
-- RLS:
--   - SELECT/INSERT/UPDATE/DELETE: admin via `public.is_admin(auth.uid())`.
--   - El backend (envío real de emails) lee con service-role / admin client,
--     que hace bypass RLS, igual que el resto de adapters de `src/lib/email/`.

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,
  locale TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT email_templates_locale_supported
    CHECK (locale IN ('es', 'en')),
  CONSTRAINT email_templates_subject_nonempty
    CHECK (length(btrim(subject)) > 0),
  CONSTRAINT email_templates_body_nonempty
    CHECK (length(btrim(body_html)) > 0)
);

COMMENT ON TABLE public.email_templates IS
  'Overrides editables del catálogo de plantillas de email (registry en código). Si no hay fila para (template_key, locale), el envío usa el default del registry.';

COMMENT ON COLUMN public.email_templates.template_key IS
  'Identificador estable de la plantilla (p. ej. "messaging.teacher_new"). El catálogo vive en src/lib/email/templates/templateRegistry.ts.';

COMMENT ON COLUMN public.email_templates.body_html IS
  'Solo el cuerpo HTML (sin layout). El wrapper unificado con header/logo/footer se aplica en wrapEmailHtml.ts.';

CREATE UNIQUE INDEX IF NOT EXISTS email_templates_key_locale_uidx
  ON public.email_templates (template_key, locale);

-- updated_at trigger -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_templates_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_templates_set_updated_at ON public.email_templates;
CREATE TRIGGER email_templates_set_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.email_templates_set_updated_at();

-- RLS ----------------------------------------------------------------------
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_templates_select_admin ON public.email_templates;
CREATE POLICY email_templates_select_admin
  ON public.email_templates FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS email_templates_modify_admin ON public.email_templates;
CREATE POLICY email_templates_modify_admin
  ON public.email_templates FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
