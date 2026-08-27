-- Tenant registration pack payload (Nagô ficha extras). Empty object when the
-- tenant has no pack. Additive only.
-- Spec: docs/superpowers/specs/2026-08-25-nago-registration-extras-pack-design.md

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS tenant_extras JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.registrations.tenant_extras IS
  'Extras for a tenant registration pack; {} when the tenant has no pack.';
