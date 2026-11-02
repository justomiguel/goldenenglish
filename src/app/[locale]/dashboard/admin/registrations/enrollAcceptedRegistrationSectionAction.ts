"use server";

import { enrollStudentInSectionAction } from "@/app/[locale]/dashboard/admin/academic/enrollmentActions";
import { assertSectionInInscriptionsCohort } from "@/lib/register/assertSectionInInscriptionsCohort";
import { requireRegistrationIntakeAdmin } from "@/lib/register/registrationIntakeActionSupport";
import { createAdminClient } from "@/lib/supabase/admin";

export async function enrollAcceptedRegistrationSectionAction(input: {
  locale: string;
  studentId: string;
  sectionId: string;
  joinDisposition?: unknown;
}): Promise<{ ok: true; enrollmentId: string } | { ok: false; code: string }> {
  const auth = await requireRegistrationIntakeAdmin();
  if (!auth.ok) return auth;
  const gate = await assertSectionInInscriptionsCohort(await createAdminClient(), input.sectionId);
  if (!gate.ok) return gate;
  return enrollStudentInSectionAction({
    locale: input.locale,
    studentId: input.studentId,
    sectionId: input.sectionId,
    joinDisposition: input.joinDisposition,
  });
}
