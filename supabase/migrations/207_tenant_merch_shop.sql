-- Tenant merch shop: catalog, pickup orders, Flow merch refs, shop-media.
-- Additive. Flag defaults off. Stock decrement lives in one paid RPC.

BEGIN;

INSERT INTO public.site_settings (key, value)
VALUES ('merch_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS site_settings_select_merch_public ON public.site_settings;
CREATE POLICY site_settings_select_merch_public ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (key = 'merch_enabled');

CREATE TABLE IF NOT EXISTS public.shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_path TEXT,
  active BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_products_active_sort_idx
  ON public.shop_products (active, sort_order, created_at);

DROP TRIGGER IF EXISTS shop_products_set_updated_at ON public.shop_products;
CREATE TRIGGER shop_products_set_updated_at
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.shop_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.shop_products (id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  sku TEXT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  price NUMERIC(12, 2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT shop_product_variants_sku_key UNIQUE (sku),
  CONSTRAINT shop_product_variants_product_size_color_key UNIQUE (product_id, size, color),
  CONSTRAINT shop_product_variants_stock_chk CHECK (stock >= 0),
  CONSTRAINT shop_product_variants_price_chk CHECK (price > 0)
);

CREATE INDEX IF NOT EXISTS shop_product_variants_product_idx
  ON public.shop_product_variants (product_id);

DROP TRIGGER IF EXISTS shop_product_variants_set_updated_at ON public.shop_product_variants;
CREATE TRIGGER shop_product_variants_set_updated_at
  BEFORE UPDATE ON public.shop_product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  assignee_student_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  currency TEXT NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  buyer_email TEXT NOT NULL,
  pay_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  gateway_provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  CONSTRAINT shop_orders_pay_token_key UNIQUE (pay_token),
  CONSTRAINT shop_orders_total_chk CHECK (total >= 0),
  CONSTRAINT shop_orders_status_chk CHECK (
    status IN (
      'pending_payment',
      'paid',
      'ready_for_pickup',
      'picked_up',
      'expired',
      'cancelled'
    )
  ),
  CONSTRAINT shop_orders_gateway_chk CHECK (
    gateway_provider IS NULL OR gateway_provider IN ('flow', 'mercadopago')
  )
);

CREATE INDEX IF NOT EXISTS shop_orders_buyer_idx
  ON public.shop_orders (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS shop_orders_assignee_idx
  ON public.shop_orders (assignee_student_id)
  WHERE assignee_student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS shop_orders_status_idx
  ON public.shop_orders (status, created_at DESC);

DROP TRIGGER IF EXISTS shop_orders_set_updated_at ON public.shop_orders;
CREATE TRIGGER shop_orders_set_updated_at
  BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.shop_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.shop_orders (id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.shop_product_variants (id) ON DELETE RESTRICT,
  quantity INT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  title TEXT NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  sku TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT shop_order_items_quantity_chk CHECK (quantity >= 1),
  CONSTRAINT shop_order_items_unit_price_chk CHECK (unit_price > 0)
);

CREATE INDEX IF NOT EXISTS shop_order_items_order_idx
  ON public.shop_order_items (order_id);
CREATE INDEX IF NOT EXISTS shop_order_items_variant_idx
  ON public.shop_order_items (variant_id);

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shop_products_select_public ON public.shop_products;
CREATE POLICY shop_products_select_public ON public.shop_products
  FOR SELECT TO anon, authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      active = true
      AND EXISTS (
        SELECT 1
        FROM public.site_settings ss
        WHERE ss.key = 'merch_enabled'
          AND ss.value = 'true'::jsonb
      )
    )
  );

DROP POLICY IF EXISTS shop_products_modify_admin ON public.shop_products;
CREATE POLICY shop_products_modify_admin ON public.shop_products
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS shop_product_variants_select_public ON public.shop_product_variants;
CREATE POLICY shop_product_variants_select_public ON public.shop_product_variants
  FOR SELECT TO anon, authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      active = true
      AND EXISTS (
        SELECT 1
        FROM public.shop_products p
        WHERE p.id = shop_product_variants.product_id
          AND p.active = true
      )
      AND EXISTS (
        SELECT 1
        FROM public.site_settings ss
        WHERE ss.key = 'merch_enabled'
          AND ss.value = 'true'::jsonb
      )
    )
  );

DROP POLICY IF EXISTS shop_product_variants_modify_admin ON public.shop_product_variants;
CREATE POLICY shop_product_variants_modify_admin ON public.shop_product_variants
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS shop_orders_select_visible ON public.shop_orders;
CREATE POLICY shop_orders_select_visible ON public.shop_orders
  FOR SELECT TO authenticated
  USING (
    buyer_id = auth.uid()
    OR assignee_student_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS shop_orders_update_admin ON public.shop_orders;
CREATE POLICY shop_orders_update_admin ON public.shop_orders
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS shop_order_items_select_visible ON public.shop_order_items;
CREATE POLICY shop_order_items_select_visible ON public.shop_order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.shop_orders o
      WHERE o.id = shop_order_items.order_id
        AND (
          o.buyer_id = auth.uid()
          OR o.assignee_student_id = auth.uid()
          OR public.is_admin(auth.uid())
        )
    )
  );

ALTER TABLE public.payment_flow_checkout_refs
  ADD COLUMN IF NOT EXISTS shop_order_id UUID
    REFERENCES public.shop_orders (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS payment_flow_checkout_refs_shop_order_idx
  ON public.payment_flow_checkout_refs (shop_order_id)
  WHERE shop_order_id IS NOT NULL;

ALTER TABLE public.payment_flow_checkout_refs
  DROP CONSTRAINT IF EXISTS payment_flow_checkout_refs_target_chk;

ALTER TABLE public.payment_flow_checkout_refs
  ADD CONSTRAINT payment_flow_checkout_refs_target_chk CHECK (
    payment_id IS NOT NULL
    OR (
      student_id IS NOT NULL
      AND section_id IS NOT NULL
      AND year IS NOT NULL
      AND month IS NOT NULL
    )
    OR bundle_id IS NOT NULL
    OR registration_id IS NOT NULL
    OR shop_order_id IS NOT NULL
  );

CREATE OR REPLACE FUNCTION public.payment_flow_reserve_commerce_ref_merch(p_shop_order_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off AS $$
DECLARE
  seq BIGINT;
  ref TEXT;
BEGIN
  IF p_shop_order_id IS NULL THEN
    RAISE EXCEPTION 'invalid_shop_order';
  END IF;
  seq := nextval('public.payment_flow_commerce_serial_seq'::regclass);
  ref := 'MERCH-' || to_char(now() AT TIME ZONE 'utc', 'YYYY') || '-' ||
    LPAD(seq::text, 8, '0');
  INSERT INTO public.payment_flow_checkout_refs (commerce_ref, shop_order_id)
  VALUES (ref, p_shop_order_id);
  RETURN ref;
END;
$$;

REVOKE ALL ON FUNCTION public.payment_flow_reserve_commerce_ref_merch(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.payment_flow_reserve_commerce_ref_merch(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.shop_mark_paid_and_decrement_stock(p_order_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'invalid_shop_order';
  END IF;

  SELECT o.status
  INTO v_status
  FROM public.shop_orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'invalid_shop_order';
  END IF;

  IF v_status = 'paid' THEN
    RETURN 'already_paid';
  END IF;

  IF v_status <> 'pending_payment' THEN
    RAISE EXCEPTION 'invalid_shop_order_status';
  END IF;

  PERFORM 1
  FROM public.shop_product_variants v
  WHERE v.id IN (
    SELECT i.variant_id
    FROM public.shop_order_items i
    WHERE i.order_id = p_order_id
  )
  ORDER BY v.id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM public.shop_order_items i
    INNER JOIN public.shop_product_variants v ON v.id = i.variant_id
    WHERE i.order_id = p_order_id
      AND v.stock < i.quantity
  ) THEN
    RETURN 'insufficient_stock';
  END IF;

  UPDATE public.shop_product_variants v
  SET stock = v.stock - i.quantity
  FROM public.shop_order_items i
  WHERE i.order_id = p_order_id
    AND v.id = i.variant_id;

  UPDATE public.shop_orders
  SET
    status = 'paid',
    paid_at = now()
  WHERE id = p_order_id;

  RETURN 'paid';
END;
$$;

REVOKE ALL ON FUNCTION public.shop_mark_paid_and_decrement_stock(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.shop_mark_paid_and_decrement_stock(UUID) TO service_role;

INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-media', 'shop-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS shop_media_select_public ON storage.objects;
CREATE POLICY shop_media_select_public ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'shop-media');

DROP POLICY IF EXISTS shop_media_insert_staff ON storage.objects;
CREATE POLICY shop_media_insert_staff ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'shop-media'
    AND public.blog_user_is_staff(auth.uid())
  );

DROP POLICY IF EXISTS shop_media_update_staff ON storage.objects;
CREATE POLICY shop_media_update_staff ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'shop-media'
    AND public.blog_user_is_staff(auth.uid())
  );

DROP POLICY IF EXISTS shop_media_delete_staff ON storage.objects;
CREATE POLICY shop_media_delete_staff ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'shop-media'
    AND public.blog_user_is_staff(auth.uid())
  );

GRANT SELECT ON public.shop_products TO anon, authenticated;
GRANT SELECT ON public.shop_product_variants TO anon, authenticated;
GRANT SELECT ON public.shop_orders TO authenticated;
GRANT SELECT ON public.shop_order_items TO authenticated;

COMMENT ON TABLE public.shop_products IS
  'Tenant merch catalog. Public when merch_enabled and active.';
COMMENT ON TABLE public.shop_product_variants IS
  'Price and stock live on the variant. Unique sku and (product, size, color).';
COMMENT ON TABLE public.shop_orders IS
  'Institute-pickup merch orders. Guest return uses opaque pay_token.';
COMMENT ON TABLE public.shop_order_items IS
  'Line snapshots. variant_id is RESTRICT so sold variants are archived, not deleted.';
COMMENT ON FUNCTION public.payment_flow_reserve_commerce_ref_merch(UUID) IS
  'SECURITY DEFINER: reserve MERCH-{year}-{seq} mapped to shop_order_id.';
COMMENT ON FUNCTION public.shop_mark_paid_and_decrement_stock(UUID) IS
  'SECURITY DEFINER: idempotent paid + stock decrement in one transaction.';

COMMIT;
