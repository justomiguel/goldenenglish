-- Tutor financial access (default-allow opt-out) + shared payments view + tutor uploads in student folder.
--
-- Background
-- ----------
-- Historia: el tutor (perfil parent) y el alumno deben ver exactamente la misma
-- "tira de pagos" mensual y el tutor debe poder subir comprobantes en nombre
-- del alumno. Trazabilidad: payments.parent_id ya queda con el UUID del tutor
-- cuando él sube el comprobante (set explícito desde la server action). Esto
-- añade la capa de **privacidad** y los **permisos de Storage** que faltaban.
--
-- Decisiones (ver docs/adr/2026-04-tutor-shared-payments-view.md)
-- ---------------------------------------------------------------
-- 1. Default-allow + opt-out: por defecto el tutor enlazado en
--    tutor_student_rel ve la situación financiera del alumno. El alumno
--    **mayor de edad** puede revocarlo desde su perfil. Modelado con
--    tutor_student_rel.financial_access_revoked_at TIMESTAMPTZ NULL
--    (NULL = activo). RLS adicional: solo el alumno mayor puede setearla /
--    limpiarla; admins pueden seguir gestionando vínculos por completo.
-- 2. Storage = carpeta del alumno: todos los receipts viven bajo
--    payment-receipts/{studentId}/..., aunque los suba el tutor. Mantenemos
--    la policy original (carpeta = uploader) para no romper receipts antiguos
--    subidos por tutores antes de esta migración.
-- 3. Trazabilidad: queda en payments.parent_id (set desde la server action
--    submitTutorPaymentReceipt) + evento user_events
--    'payment_receipt_submitted_tutor'.
--
-- Idempotente: ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE FUNCTION,
-- DROP POLICY IF EXISTS / CREATE POLICY.

-- 1) Privacidad ----------------------------------------------------------
ALTER TABLE public.tutor_student_rel
  ADD COLUMN IF NOT EXISTS financial_access_revoked_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS financial_access_revoked_by UUID NULL
    REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.tutor_student_rel.financial_access_revoked_at IS
  'NULL = el tutor ve la tira de pagos del alumno y puede subir comprobantes. NON-NULL = el alumno mayor revocó ese acceso (default-allow + opt-out).';

COMMENT ON COLUMN public.tutor_student_rel.financial_access_revoked_by IS
  'Alumno (o admin) que revocó el acceso financiero del tutor. Información de auditoría.';

-- 2) Helper SECURITY DEFINER ---------------------------------------------
-- Resolver acceso financiero sin tener que reescribir EXISTS en cada policy.
CREATE OR REPLACE FUNCTION public.tutor_can_view_student_finance(
  p_tutor_id UUID,
  p_student_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tutor_student_rel ts
    WHERE ts.tutor_id = p_tutor_id
      AND ts.student_id = p_student_id
      AND ts.financial_access_revoked_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.tutor_can_view_student_finance(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tutor_can_view_student_finance(UUID, UUID) TO authenticated;

-- 3) RLS payments: select / insert / update con vínculo activo ------------
-- SELECT: admin, alumno, parent_id legacy, teacher (legado de 002), o tutor
-- enlazado con acceso financiero activo.
DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select
  ON public.payments FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR student_id = auth.uid()
    OR parent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles t
      WHERE t.id = auth.uid() AND t.role = 'teacher'
    )
    OR public.tutor_can_view_student_finance(auth.uid(), payments.student_id)
  );

-- INSERT del tutor: además de tener el vínculo, debe tener acceso financiero.
DROP POLICY IF EXISTS payments_insert_parent ON public.payments;
CREATE POLICY payments_insert_parent
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id = auth.uid()
    AND public.tutor_can_view_student_finance(auth.uid(), payments.student_id)
  );

-- UPDATE del tutor: pendiente, vínculo activo, parent_id queda ya seteado
-- por la app (alineado con submitTutorPaymentReceipt).
DROP POLICY IF EXISTS payments_update_parent ON public.payments;
CREATE POLICY payments_update_parent
  ON public.payments FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND public.tutor_can_view_student_finance(auth.uid(), payments.student_id)
    AND (parent_id IS NULL OR parent_id = auth.uid())
  )
  WITH CHECK (
    parent_id = auth.uid()
    AND status = 'pending'
  );

-- 4) RLS Storage: tutor escribe / lee receipts en carpeta del alumno -----
-- Mantenemos las policies existentes (carpeta = uploader) por compatibilidad
-- con receipts que siguen el path antiguo {tutorId}/...; añadimos las
-- variantes "carpeta del alumno enlazado".
DROP POLICY IF EXISTS payment_receipts_insert_tutor_for_student
  ON storage.objects;
CREATE POLICY payment_receipts_insert_tutor_for_student
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts'
    AND public.tutor_can_view_student_finance(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );

DROP POLICY IF EXISTS payment_receipts_select_tutor_for_student
  ON storage.objects;
CREATE POLICY payment_receipts_select_tutor_for_student
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND public.tutor_can_view_student_finance(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );

DROP POLICY IF EXISTS payment_receipts_update_tutor_for_student
  ON storage.objects;
CREATE POLICY payment_receipts_update_tutor_for_student
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND public.tutor_can_view_student_finance(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );

-- 5) RLS tutor_student_rel: alumno mayor toggle de acceso financiero -----
-- Conservamos la policy admin existente y añadimos la del alumno mayor:
-- solo el dueño (auth.uid() = student_id) y solo si NO es minor puede
-- alterar las columnas financial_access_revoked_at / financial_access_revoked_by.
-- La RLS de UPDATE no aísla columnas: la app debe limitarse a esos campos
-- (ver studentFinancialAccessActions.ts), pero la condición de USING /
-- WITH CHECK garantiza que el tutor_id no pueda cambiarse en el cliente.
DROP POLICY IF EXISTS tutor_student_rel_update_student_adult
  ON public.tutor_student_rel;
CREATE POLICY tutor_student_rel_update_student_adult
  ON public.tutor_student_rel FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND COALESCE(p.is_minor, false) = false
    )
  )
  WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND COALESCE(p.is_minor, false) = false
    )
  );
