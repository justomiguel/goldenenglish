-- Which section variant each institute last published.
-- The Pulsar service role writes these rows. There is no anon or authenticated policy.

CREATE TABLE IF NOT EXISTS public.platform_tenant_variant_pins (
  tenant_slug text NOT NULL,
  variant_id text NOT NULL,
  major int NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_slug, variant_id, major)
);

ALTER TABLE public.platform_tenant_variant_pins ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.platform_tenant_variant_pins FROM PUBLIC, anon, authenticated;
