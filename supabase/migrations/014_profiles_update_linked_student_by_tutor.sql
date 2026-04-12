-- Padre/tutor autenticado puede actualizar perfiles de alumnos vinculados (rol sigue siendo student).

DROP POLICY IF EXISTS profiles_update_linked_student_by_tutor ON public.profiles;

CREATE POLICY profiles_update_linked_student_by_tutor
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = profiles.id
    )
    AND profiles.role = 'student'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tutor_student_rel ts
      WHERE ts.tutor_id = auth.uid() AND ts.student_id = profiles.id
    )
    AND role = 'student'
  );
