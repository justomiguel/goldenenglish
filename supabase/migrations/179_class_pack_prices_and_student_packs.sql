-- Class packs: catálogo de precios no lineal + bolsa mensual del alumno.
--
-- El catálogo es a NIVEL INSTITUTO, no por sección, porque la bolsa es del alumno y cruza secciones:
-- un alumno inscripto en dos secciones con tarifas distintas no tendría un precio único para
-- "8 clases". Cada fila es un tramo `(class_count, amount)` y `amount` es el precio TOTAL del
-- paquete, no unitario. Ahí vive la no linealidad, sin fórmula ni interpolación: un class_count sin
-- fila es un error explícito en la app (`resolveClassPackPrice` → { code: "no_tier" }), nunca un
-- cálculo inventado.
--
-- La vigencia usa el mismo criterio que section_fee_plans: el tramo vigente para (year, month) es el
-- del mayor (effective_from_year, effective_from_month) <= (year, month). Se archiva, no se borra, para
-- que las compras históricas sigan apuntando a la fila que las coteó.
--
-- `student_class_packs` es a la vez la bolsa y el cargo. Deliberadamente NO reusa `payments`:
-- `payments` tiene índices únicos parciales por (student_id, section_id, month, year) y por
-- (student_id, month, year) para filas legacy sin sección, `payment_kind` no participa de ninguno de
-- los dos, y toda la grilla de 12 meses / matriz de cobranzas / ambos flujos de pasarela de cuotas
-- cuelgan de esa forma. El precedente para un producto de cobro paralelo es `event_payments` (137).
--
-- ADR: docs/adr/2026-08-class-pack-billing.md

-- Catálogo de precios ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_pack_prices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_from_year   SMALLINT NOT NULL,
  effective_from_month  SMALLINT NOT NULL,
  class_count           SMALLINT NOT NULL,
  amount                NUMERIC(12, 2) NOT NULL,
  currency              TEXT NOT NULL,
  archived_at           TIMESTAMPTZ,
  archived_by           UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by            UUID NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT class_pack_prices_year_range
    CHECK (effective_from_year BETWEEN 2000 AND 2100),
  CONSTRAINT class_pack_prices_month_range
    CHECK (effective_from_month BETWEEN 1 AND 12),
  CONSTRAINT class_pack_prices_class_count_range
    CHECK (class_count > 0 AND class_count <= 60),
  CONSTRAINT class_pack_prices_amount_positive
    CHECK (amount >= 0),
  CONSTRAINT class_pack_prices_currency_iso
    CHECK (currency ~ '^[A-Z]{3}$')
);

COMMENT ON TABLE public.class_pack_prices IS
  'Catálogo de precios por cantidad de clases, a nivel instituto, con vigencias. El tramo vigente para (year, month) es el más reciente con (effective_from_year, effective_from_month) <= (year, month).';

COMMENT ON COLUMN public.class_pack_prices.class_count IS
  'Cantidad de clases del paquete. Cada tramo es una fila; no hay interpolación entre tramos.';

COMMENT ON COLUMN public.class_pack_prices.amount IS
  'Precio TOTAL del paquete de class_count clases (no unitario). La no linealidad se expresa como tabla: 1 clase -> 40, 2 -> 70, 4 -> 120.';

COMMENT ON COLUMN public.class_pack_prices.archived_at IS
  'Soft-delete: deja de ofrecerse sin romper la trazabilidad de las compras que ya usaron este tramo.';

CREATE UNIQUE INDEX IF NOT EXISTS class_pack_prices_period_count_uidx
  ON public.class_pack_prices (effective_from_year, effective_from_month, class_count)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS class_pack_prices_period_idx
  ON public.class_pack_prices (effective_from_year, effective_from_month);

-- Bolsa mensual del alumno (y cargo) ---------------------------------------
CREATE TABLE IF NOT EXISTS public.student_class_packs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  year              SMALLINT NOT NULL,
  month             SMALLINT NOT NULL,
  class_count       SMALLINT NOT NULL,
  amount            NUMERIC(12, 2) NOT NULL,
  currency          TEXT NOT NULL,
  price_id          UUID NULL REFERENCES public.class_pack_prices (id) ON DELETE SET NULL,
  status                public.payment_status NOT NULL DEFAULT 'pending',
  purchased_by          UUID NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  -- Nombres tomados de event_payments (137), no de payments: allí `receipt_url` guarda en realidad un
  -- storage path, y repetir ese nombre engañoso en una tabla nueva no tiene sentido.
  receipt_storage_path  TEXT,
  reviewed_by           UUID NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  review_notes          TEXT,
  paid_at               TIMESTAMPTZ,
  gateway_provider      TEXT NULL,
  mp_preference_id      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_class_packs_year_range
    CHECK (year BETWEEN 2000 AND 2100),
  CONSTRAINT student_class_packs_month_range
    CHECK (month BETWEEN 1 AND 12),
  CONSTRAINT student_class_packs_class_count_positive
    CHECK (class_count > 0),
  CONSTRAINT student_class_packs_amount_positive
    CHECK (amount >= 0),
  CONSTRAINT student_class_packs_currency_iso
    CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT student_class_packs_gateway_provider_check
    CHECK (gateway_provider IS NULL OR gateway_provider IN ('flow', 'mercadopago'))
);

COMMENT ON TABLE public.student_class_packs IS
  'Bolsa mensual de clases prepagas del alumno, y a la vez el cargo. Estrictamente mensual: no hay arrastre al mes siguiente. Solo los paquetes en estado approved o exempt otorgan créditos.';

COMMENT ON COLUMN public.student_class_packs.class_count IS
  'Clases contratadas. Snapshot: una edición posterior del catálogo no debe reformular una compra saldada.';

COMMENT ON COLUMN public.student_class_packs.amount IS
  'Precio pagado, congelado al momento de comprar (snapshot, igual criterio que student_promotions).';

COMMENT ON COLUMN public.student_class_packs.price_id IS
  'Tramo del catálogo que coteó esta compra. Solo trazabilidad: ON DELETE SET NULL, y el monto real vive en amount.';

COMMENT ON COLUMN public.student_class_packs.status IS
  'pending no otorga créditos (una transferencia en revisión no puede volverse clases gratis). Otorgan approved y exempt; exempt es el paquete bonificado por admin.';

-- Sin índice único por (student_id, year, month): se permiten recargas en el mismo mes y el saldo es
-- la suma de los paquetes que otorgan. Cada compra se cotiza por su propio tamaño.
CREATE INDEX IF NOT EXISTS student_class_packs_student_period_idx
  ON public.student_class_packs (student_id, year, month);

CREATE INDEX IF NOT EXISTS student_class_packs_status_period_idx
  ON public.student_class_packs (status, year, month);

-- updated_at triggers ------------------------------------------------------
-- Se reusa el helper compartido `public.set_updated_at()` (001), igual que section_attendance,
-- section_enrollments, event_payments y el resto. Duplicar la función por tabla es lo que este repo
-- justamente no hace.
DROP TRIGGER IF EXISTS class_pack_prices_set_updated_at ON public.class_pack_prices;
CREATE TRIGGER class_pack_prices_set_updated_at
  BEFORE UPDATE ON public.class_pack_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS student_class_packs_set_updated_at ON public.student_class_packs;
CREATE TRIGGER student_class_packs_set_updated_at
  BEFORE UPDATE ON public.student_class_packs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Family predicate ---------------------------------------------------------
-- SECURITY DEFINER por el mismo motivo que los helpers de la 177: la lectura de tutor_student_rel
-- desde la política de otra tabla vuelve a aplicar RLS y encadena predicados. Reusado por la 180.
CREATE OR REPLACE FUNCTION public.user_is_family_of_student(p_user UUID, p_student UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_user = p_student
    OR EXISTS (
      SELECT 1
      FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = p_user
        AND ts.student_id = p_student
    );
$$;

COMMENT ON FUNCTION public.user_is_family_of_student(uuid, uuid) IS
  'SECURITY DEFINER: el alumno mismo o un tutor vinculado, sin re-entrar RLS de tutor_student_rel desde la política de otra tabla.';

GRANT EXECUTE ON FUNCTION public.user_is_family_of_student(uuid, uuid) TO authenticated;

-- RLS ----------------------------------------------------------------------
ALTER TABLE public.class_pack_prices ENABLE ROW LEVEL SECURITY;

-- Las familias necesitan ver los tramos para poder comprar; el catálogo no es información sensible.
DROP POLICY IF EXISTS class_pack_prices_select_authenticated ON public.class_pack_prices;
CREATE POLICY class_pack_prices_select_authenticated
  ON public.class_pack_prices FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS class_pack_prices_admin_write ON public.class_pack_prices;
CREATE POLICY class_pack_prices_admin_write
  ON public.class_pack_prices FOR ALL
  TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

ALTER TABLE public.student_class_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_class_packs_select_scope ON public.student_class_packs;
CREATE POLICY student_class_packs_select_scope
  ON public.student_class_packs FOR SELECT
  TO authenticated
  USING (
    public.is_admin((SELECT auth.uid()))
    OR public.user_is_family_of_student((SELECT auth.uid()), student_id)
  );

DROP POLICY IF EXISTS student_class_packs_admin_write ON public.student_class_packs;
CREATE POLICY student_class_packs_admin_write
  ON public.student_class_packs FOR ALL
  TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

-- Autogestión de la familia, espejando payments_insert_student_self / _update_student_self (055):
-- puede crear su propio paquete pendiente (con comprobante) y editarlo mientras siga pendiente.
-- Nunca puede aprobarlo: aprobar es lo que otorga créditos.
DROP POLICY IF EXISTS student_class_packs_insert_family ON public.student_class_packs;
CREATE POLICY student_class_packs_insert_family
  ON public.student_class_packs FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'pending'
    AND public.user_is_family_of_student((SELECT auth.uid()), student_id)
  );

DROP POLICY IF EXISTS student_class_packs_update_family ON public.student_class_packs;
CREATE POLICY student_class_packs_update_family
  ON public.student_class_packs FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND public.user_is_family_of_student((SELECT auth.uid()), student_id)
  )
  WITH CHECK (
    status = 'pending'
    AND public.user_is_family_of_student((SELECT auth.uid()), student_id)
  );
