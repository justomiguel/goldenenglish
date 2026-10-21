-- Shop catalog slugs. A previous slug stays as an alias and redirects.

ALTER TABLE public.shop_products
  ADD COLUMN IF NOT EXISTS slug text;

WITH normalized AS (
  SELECT
    id,
    NULLIF(
      trim(both '-' FROM regexp_replace(
        translate(
          lower(title),
          'áéíóúüñàèìòùâêîôûäëïöüçÁÉÍÓÚÜÑ',
          'aeiouunaeiouaeiouaeioucaeiouun'
        ),
        '[^a-z0-9]+',
        '-',
        'g'
      )),
      ''
    ) AS base
  FROM public.shop_products
  WHERE slug IS NULL OR btrim(slug) = ''
),
ranked AS (
  SELECT
    id,
    COALESCE(base, 'producto') AS base,
    row_number() OVER (PARTITION BY COALESCE(base, 'producto') ORDER BY id) AS n
  FROM normalized
)
UPDATE public.shop_products AS product
SET slug = CASE
  WHEN ranked.n = 1 THEN ranked.base
  ELSE ranked.base || '-' || ranked.n::text
END
FROM ranked
WHERE product.id = ranked.id
  AND (product.slug IS NULL OR btrim(product.slug) = '');

ALTER TABLE public.shop_products
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS shop_products_slug_key
  ON public.shop_products (slug);

CREATE TABLE IF NOT EXISTS public.shop_product_slug_aliases (
  slug text PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.shop_products (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_product_slug_aliases_product_idx
  ON public.shop_product_slug_aliases (product_id);

ALTER TABLE public.shop_product_slug_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shop_product_slug_aliases_select_public
  ON public.shop_product_slug_aliases;
CREATE POLICY shop_product_slug_aliases_select_public
  ON public.shop_product_slug_aliases
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS shop_product_slug_aliases_modify_admin
  ON public.shop_product_slug_aliases;
CREATE POLICY shop_product_slug_aliases_modify_admin
  ON public.shop_product_slug_aliases
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT ON public.shop_product_slug_aliases TO anon, authenticated;

COMMENT ON COLUMN public.shop_products.slug IS
  'Public catalog path segment. Unique. A previous value lives in shop_product_slug_aliases.';
COMMENT ON TABLE public.shop_product_slug_aliases IS
  'Retired shop product slugs. Public read is the slug and product id only.';
