"use server";

import { z } from "zod";
import { moveStudentSectionWithCarryAction, previewSectionMoveCarryAction } from "@/app/[locale]/dashboard/admin/academic/moveStudentSectionWithCarryAction";
import {
  DEFAULT_SECTION_MOVE_CARRY,
  type CarryResolution,
  type SectionMoveCarryFlags,
} from "@/lib/academics/planSectionMoveCarry";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";
import { loadRegistrationSectionMoveContext } from "@/lib/register/loadRegistrationSectionMoveContext";

const idZ = z.string().uuid();

async function contextOrDeny(input: { registrationId: string; sectionId: string; cohortId: string }) {
  let supabase;
  try {
    ({ supabase } = await assertAdmin());
  } catch {
    logServerAuthzDenied("moveRegistrationSection");
    return { ok: false as const, code: "forbidden" };
  }
  const registrationId = idZ.safeParse(input.registrationId);
  const sectionId = idZ.safeParse(input.sectionId);
  const cohortId = idZ.safeParse(input.cohortId);
  if (!registrationId.success || !sectionId.success || !cohortId.success) {
    return { ok: false as const, code: "not_found" };
  }
  return loadRegistrationSectionMoveContext(supabase, {
    registrationId: registrationId.data,
    sectionId: sectionId.data,
    cohortId: cohortId.data,
  });
}

export async function previewRegistrationSectionMoveAction(input: {
  registrationId: string;
  sectionId: string;
  cohortId: string;
}) {
  const context = await contextOrDeny(input);
  if (!context.ok) return context;
  return previewSectionMoveCarryAction({
    studentId: context.studentId,
    toSectionId: input.sectionId,
    fromEnrollmentIds: context.fromEnrollmentIds,
  });
}

export async function moveRegistrationSectionAction(input: {
  locale: string;
  registrationId: string;
  sectionId: string;
  cohortId: string;
  carry?: SectionMoveCarryFlags;
  choices?: CarryResolution[];
}): Promise<{ ok: true } | { ok: false; code: string; detail?: string }> {
  const context = await contextOrDeny(input);
  if (!context.ok) return context;
  const moved = await moveStudentSectionWithCarryAction({
    locale: input.locale,
    studentId: context.studentId,
    toSectionId: input.sectionId,
    fromEnrollmentIds: context.fromEnrollmentIds,
    carry: input.carry ?? DEFAULT_SECTION_MOVE_CARRY,
    choices: input.choices ?? [],
  });
  if (!moved.ok) return { ok: false, code: moved.code, detail: moved.detail };
  return { ok: true };
}
