"use server";

import { z } from "zod";
import { logServerAuthzDenied, logServerException } from "@/lib/logging/serverActionLog";
import { loadAcademicProfileForStudent } from "@/lib/academic-profile/loadAcademicProfileForStudent";
import {
  openAcademicProfileStaffSession,
  staffMayWriteAcademicValue,
} from "@/lib/academic-profile/academicProfileStaffSession";
import type { AcademicProfileCardField } from "@/lib/academic-profile/academicProfileCard";

const schema = z.object({
  studentId: z.string().uuid(),
  sectionId: z.string().uuid(),
});

export async function loadAcademicProfileCardAction(
  input: z.input<typeof schema>,
): Promise<{ ok: true; fields: AcademicProfileCardField[] } | { ok: false; error: "forbidden" | "invalid" | "failed" }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const session = await openAcademicProfileStaffSession();
    if (!session) return { ok: false, error: "forbidden" };
    const allowed = await staffMayWriteAcademicValue(session, parsed.data);
    if (!allowed) {
      logServerAuthzDenied("loadAcademicProfileCardAction", { studentId: parsed.data.studentId });
      return { ok: false, error: "forbidden" };
    }
    const fields = await loadAcademicProfileForStudent(session.supabase, parsed.data.studentId);
    return { ok: true, fields };
  } catch (error) {
    logServerException("loadAcademicProfileCardAction", error);
    return { ok: false, error: "failed" };
  }
}
