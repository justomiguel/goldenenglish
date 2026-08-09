-- Libro mayor de créditos de clase: consumo por asistencia + clases a recuperar.
--
-- Regla de producto: consumen clase los estados present, late y absent. `excused` (justificado) NO
-- consume, y genera un derecho a recuperar esa clase en otro momento, en otra sección o con otros
-- profes. Agendar y gastar esas recuperaciones es un proyecto aparte; acá solo se acumulan y se
-- muestran.
--
-- Por qué un LIBRO MAYOR y no un contador en la bolsa: la asistencia es editable y borrable. Un
-- contador se descuadra en la primera corrección de un registro y no se puede auditar. Con una fila
-- por asistencia y UNIQUE (attendance_id), corregir es idempotente; con FK ON DELETE CASCADE, borrar
-- la asistencia devuelve el crédito solo.
--
-- Por qué un TRIGGER y no código de aplicación: la asistencia se escribe desde varios caminos
-- (matriz del profe, acciones puntuales, RPC). El primero que no se instrumente rompería la
-- facturación en silencio. Con el trigger dueño del libro mayor y sin políticas de escritura para
-- `authenticated`, ese bypass es imposible por construcción.
--
-- El trigger NUNCA falla por estado de facturación. Un profe tomando asistencia no puede recibir un
-- error de billing, y el registro es el hecho académico de lo que pasó. Como consecuencia el saldo
-- puede quedar negativo: eso se expone como deuda de clases para que el staff la resuelva vendiendo
-- una recarga.
--
-- ADR: docs/adr/2026-08-class-pack-billing.md

-- Consumo ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_credit_consumptions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id  UUID NOT NULL UNIQUE
                   REFERENCES public.section_attendance (id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  enrollment_id  UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  section_id     UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  attended_on    DATE NOT NULL,
  year           SMALLINT NOT NULL,
  month          SMALLINT NOT NULL,
  credits        SMALLINT NOT NULL DEFAULT 1,
  source_status  public.section_attendance_status NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT class_credit_consumptions_credits_positive CHECK (credits > 0),
  CONSTRAINT class_credit_consumptions_month_range CHECK (month BETWEEN 1 AND 12)
);

COMMENT ON TABLE public.class_credit_consumptions IS
  'Una fila por asistencia que consume una clase prepaga. Derivada de section_attendance por trigger; UNIQUE (attendance_id) hace la corrección idempotente y el cascade la hace reversible.';

COMMENT ON COLUMN public.class_credit_consumptions.source_status IS
  'Estado de asistencia que generó el consumo (present, absent o late). Se guarda para poder explicar el cargo al alumno.';

COMMENT ON COLUMN public.class_credit_consumptions.year IS
  'Desnormalizado de attended_on por el trigger: el saldo del mes es una lectura indexada sin aritmética de fechas.';

CREATE INDEX IF NOT EXISTS class_credit_consumptions_student_period_idx
  ON public.class_credit_consumptions (student_id, year, month);

CREATE INDEX IF NOT EXISTS class_credit_consumptions_section_period_idx
  ON public.class_credit_consumptions (section_id, year, month);

-- Clases a recuperar -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_recovery_credits (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_attendance_id  UUID NOT NULL UNIQUE
                          REFERENCES public.section_attendance (id) ON DELETE CASCADE,
  student_id            UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  origin_enrollment_id  UUID NOT NULL REFERENCES public.section_enrollments (id) ON DELETE CASCADE,
  origin_section_id     UUID NOT NULL REFERENCES public.academic_sections (id) ON DELETE CASCADE,
  origin_attended_on    DATE NOT NULL,
  year                  SMALLINT NOT NULL,
  month                 SMALLINT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT class_recovery_credits_month_range CHECK (month BETWEEN 1 AND 12)
);

COMMENT ON TABLE public.class_recovery_credits IS
  'Clases justificadas que el instituto le debe al alumno. Una por asistencia excused. Sin columnas de consumo todavía: agendar y gastar la recuperación es el proyecto 2, que las agrega.';

CREATE INDEX IF NOT EXISTS class_recovery_credits_student_period_idx
  ON public.class_recovery_credits (student_id, year, month);

-- Trigger ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_class_credit_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_student_id   UUID;
  v_section_id   UUID;
  v_billing_mode TEXT;
  v_year         SMALLINT;
  v_month        SMALLINT;
BEGIN
  SELECT e.student_id, e.section_id, s.billing_mode
    INTO v_student_id, v_section_id, v_billing_mode
  FROM public.section_enrollments e
  JOIN public.academic_sections s ON s.id = e.section_id
  WHERE e.id = NEW.enrollment_id;

  -- Solo secciones que se cobran por paquete. Cambiar una sección a class_pack no hace backfill:
  -- inventaría cargos sobre meses ya saldados con cuota fija.
  IF v_billing_mode IS DISTINCT FROM 'class_pack' THEN
    RETURN NULL;
  END IF;

  v_year  := EXTRACT(YEAR FROM NEW.attended_on)::SMALLINT;
  v_month := EXTRACT(MONTH FROM NEW.attended_on)::SMALLINT;

  IF NEW.status IN ('present', 'absent', 'late') THEN
    DELETE FROM public.class_recovery_credits WHERE origin_attendance_id = NEW.id;

    INSERT INTO public.class_credit_consumptions (
      attendance_id, student_id, enrollment_id, section_id,
      attended_on, year, month, credits, source_status
    )
    VALUES (
      NEW.id, v_student_id, NEW.enrollment_id, v_section_id,
      NEW.attended_on, v_year, v_month, 1, NEW.status
    )
    ON CONFLICT (attendance_id) DO UPDATE
      SET student_id    = EXCLUDED.student_id,
          enrollment_id = EXCLUDED.enrollment_id,
          section_id    = EXCLUDED.section_id,
          attended_on   = EXCLUDED.attended_on,
          year          = EXCLUDED.year,
          month         = EXCLUDED.month,
          source_status = EXCLUDED.source_status;

  ELSIF NEW.status = 'excused' THEN
    DELETE FROM public.class_credit_consumptions WHERE attendance_id = NEW.id;

    INSERT INTO public.class_recovery_credits (
      origin_attendance_id, student_id, origin_enrollment_id, origin_section_id,
      origin_attended_on, year, month
    )
    VALUES (
      NEW.id, v_student_id, NEW.enrollment_id, v_section_id,
      NEW.attended_on, v_year, v_month
    )
    ON CONFLICT (origin_attendance_id) DO UPDATE
      SET student_id           = EXCLUDED.student_id,
          origin_enrollment_id = EXCLUDED.origin_enrollment_id,
          origin_section_id    = EXCLUDED.origin_section_id,
          origin_attended_on   = EXCLUDED.origin_attended_on,
          year                 = EXCLUDED.year,
          month                = EXCLUDED.month;
  END IF;

  -- Sin ELSE: un valor futuro de section_attendance_status no produce efecto en el libro mayor. Ante
  -- un estado desconocido preferimos no cobrar (revisable) antes que cobrar mal (plata mal movida).
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.sync_class_credit_ledger() IS
  'Mantiene class_credit_consumptions y class_recovery_credits desde section_attendance. Único escritor del libro mayor. No falla nunca por estado de facturación: tomar asistencia no puede romperse por billing.';

-- No hay rama DELETE: ambas FK son ON DELETE CASCADE, así que borrar la asistencia revierte su efecto
-- en el libro mayor automáticamente.
DROP TRIGGER IF EXISTS section_attendance_sync_class_credit_ledger ON public.section_attendance;
CREATE TRIGGER section_attendance_sync_class_credit_ledger
  AFTER INSERT OR UPDATE ON public.section_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_class_credit_ledger();

-- RLS ----------------------------------------------------------------------
-- Solo lectura, y solo para admin y la familia del alumno. Los profes ven asistencia, no créditos:
-- el saldo es información de facturación, no académica.
ALTER TABLE public.class_credit_consumptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_credit_consumptions_select_scope ON public.class_credit_consumptions;
CREATE POLICY class_credit_consumptions_select_scope
  ON public.class_credit_consumptions FOR SELECT
  TO authenticated
  USING (
    public.is_admin((SELECT auth.uid()))
    OR public.user_is_family_of_student((SELECT auth.uid()), student_id)
  );

ALTER TABLE public.class_recovery_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_recovery_credits_select_scope ON public.class_recovery_credits;
CREATE POLICY class_recovery_credits_select_scope
  ON public.class_recovery_credits FOR SELECT
  TO authenticated
  USING (
    public.is_admin((SELECT auth.uid()))
    OR public.user_is_family_of_student((SELECT auth.uid()), student_id)
  );

-- Defensa en profundidad. La protección durable es RLS: no existe ninguna política de INSERT/UPDATE/
-- DELETE en estas tablas, así que `authenticated` no puede escribirlas ni con grants de tabla. El
-- REVOKE hace la intención explícita, pero OJO: la 166 corrió `GRANT ALL ON ALL TABLES IN SCHEMA
-- public` y dejó ALTER DEFAULT PRIVILEGES con ALL, así que una futura migración que repita ese GRANT
-- deshace este REVOKE sin deshacer RLS. El test de base contra el stack local es lo que lo verifica.
-- `service_role` queda intacto a propósito: el trigger es SECURITY DEFINER y los loaders admin leen
-- con createAdminClient(). Ningún código de aplicación debe escribir estas tablas.
REVOKE INSERT, UPDATE, DELETE ON public.class_credit_consumptions FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.class_recovery_credits FROM authenticated, anon;
