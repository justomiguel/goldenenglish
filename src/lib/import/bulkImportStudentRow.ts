import type { SupabaseClient } from "@supabase/supabase-js";
import type { CsvStudentRow } from "@/lib/import/studentRowSchema";
import { defaultEmail, normalizeDni } from "@/lib/import/studentImportUtils";
import {
  mergeStudentProfileCsvPatch,
  type ProfileForMerge,
} from "@/lib/import/mergeStudentProfileCsv";
import { resolveCourseId, enrollmentExists } from "@/lib/import/bulkImportEnrollment";
import {
  ensureParentUserId,
  hasPaymentsForYear,
  linkParentStudent,
  seedPayments2026,
} from "@/lib/import/bulkImportHelpers";
import type { TutorDisplayDefaults } from "@/lib/register/tutorDisplayNameParts";
import { inviteMeta, isDuplicateAuthError } from "@/lib/import/bulkImportStudentsAuthHelpers";
import {
  IMPORT_ROW_AUTH_ERROR,
  IMPORT_ROW_EMAIL_DNI_CONFLICT,
  IMPORT_ROW_EMAIL_DNI_MISMATCH,
  IMPORT_ROW_ENROLLMENT_FAILED,
  IMPORT_ROW_EXISTING_NON_STUDENT,
  IMPORT_ROW_NOOP,
  IMPORT_ROW_NO_USER_ID,
  IMPORT_ROW_PROFILE_MISSING,
  IMPORT_ROW_PROFILE_UPDATE_FAILED,
  IMPORT_ROW_SUCCESS,
} from "@/lib/import/importResultMessageCodes";

export type ImportRowOutcome =
  | {
      kind: "fail";
      message: string;
    }
  | {
      kind: "ok";
      message: string;
      createdUsers: number;
      profilesUpdated: number;
      enrolled: number;
      paymentsSeeded: number;
      skippedNoop: number;
    };

export type ImportRowEmailMap = Map<string, string>;

async function resolveOrCreateStudentId(
  admin: SupabaseClient,
  row: CsvStudentRow,
  emailMap: ImportRowEmailMap,
  emailNorm: string,
  dni: string,
  password: string,
  reloadEmailMap: () => Promise<ImportRowEmailMap>,
): Promise<{ studentId: string | null; createdUsers: number; emailMap: ImportRowEmailMap; rowFailMessage?: string }> {
  let map = emailMap;
  let createdUsers = 0;
  const uidByEmail = map.get(emailNorm);
  const { data: byDni } = await admin
    .from("profiles")
    .select("id, role, dni_or_passport, phone, birth_date")
    .eq("dni_or_passport", dni)
    .maybeSingle();

  if (uidByEmail && byDni?.id && uidByEmail !== byDni.id) {
    return { studentId: null, createdUsers, emailMap: map, rowFailMessage: IMPORT_ROW_EMAIL_DNI_MISMATCH };
  }

  if (uidByEmail) return { studentId: uidByEmail, createdUsers, emailMap: map };
  if (byDni?.id) return { studentId: byDni.id as string, createdUsers, emailMap: map };

  const studentMeta = inviteMeta(
    {
      first_name: row.first_name,
      last_name: row.last_name,
      dni_or_passport: dni,
      phone: row.phone ?? "",
      birth_date: row.birth_date ?? "",
    },
    "student",
  );
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: emailNorm,
    password,
    email_confirm: true,
    user_metadata: studentMeta,
  });

  if (createErr) {
    if (isDuplicateAuthError(createErr)) {
      map = await reloadEmailMap();
      const retryId = map.get(emailNorm);
      if (retryId) return { studentId: retryId, createdUsers, emailMap: map };
    }
    return { studentId: null, createdUsers, emailMap: map, rowFailMessage: IMPORT_ROW_AUTH_ERROR };
  }
  if (created?.user) {
    createdUsers = 1;
    map.set(emailNorm, created.user.id);
    return { studentId: created.user.id, createdUsers, emailMap: map };
  }
  return { studentId: null, createdUsers, emailMap: map, rowFailMessage: IMPORT_ROW_NO_USER_ID };
}

export async function processBulkImportStudentRow(
  admin: SupabaseClient,
  row: CsvStudentRow,
  tutorDefaults: TutorDisplayDefaults,
  emailMap: ImportRowEmailMap,
  reloadEmailMap: () => Promise<ImportRowEmailMap>,
): Promise<{ outcome: ImportRowOutcome; emailMap: ImportRowEmailMap }> {
  const { dni, password } = normalizeDni(row.dni_or_passport);
  const emailNorm = (row.email?.trim() || defaultEmail(dni)).toLowerCase();

  const resolved = await resolveOrCreateStudentId(
    admin,
    row,
    emailMap,
    emailNorm,
    dni,
    password,
    reloadEmailMap,
  );
  if (resolved.rowFailMessage || !resolved.studentId) {
    return {
      outcome: { kind: "fail", message: resolved.rowFailMessage ?? IMPORT_ROW_NO_USER_ID },
      emailMap: resolved.emailMap,
    };
  }
  const studentId = resolved.studentId;
  const map = resolved.emailMap;
  const createdUsers = resolved.createdUsers;

  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("id, role, phone, birth_date, dni_or_passport")
    .eq("id", studentId)
    .single();

  if (profErr || !profile) {
    return { outcome: { kind: "fail", message: IMPORT_ROW_PROFILE_MISSING }, emailMap: map };
  }
  if (profile.role !== "student") {
    return { outcome: { kind: "fail", message: IMPORT_ROW_EXISTING_NON_STUDENT }, emailMap: map };
  }

  const merge = mergeStudentProfileCsvPatch(profile as ProfileForMerge, row, dni);
  if (merge.dniConflict) {
    return { outcome: { kind: "fail", message: IMPORT_ROW_EMAIL_DNI_CONFLICT }, emailMap: map };
  }

  const courseId = await resolveCourseId(admin, row);
  let enrollmentToAdd = false;
  if (courseId) {
    enrollmentToAdd = !(await enrollmentExists(admin, studentId, courseId));
  }
  const paymentsToSeed = !(await hasPaymentsForYear(admin, studentId, 2026));

  if (!merge.hasNew && !enrollmentToAdd && !paymentsToSeed) {
    return {
      outcome: {
        kind: "ok",
        message: IMPORT_ROW_NOOP,
        createdUsers,
        profilesUpdated: 0,
        enrolled: 0,
        paymentsSeeded: 0,
        skippedNoop: 1,
      },
      emailMap: map,
    };
  }

  let profilesUpdated = 0;
  if (merge.hasNew) {
    const { error: upErr } = await admin.from("profiles").update(merge.patch).eq("id", studentId);
    if (upErr) {
      return { outcome: { kind: "fail", message: IMPORT_ROW_PROFILE_UPDATE_FAILED }, emailMap: map };
    }
    profilesUpdated = 1;
  }

  const parentId = await ensureParentUserId(admin, row, tutorDefaults);
  if (parentId) await linkParentStudent(admin, parentId, studentId);

  let enrolled = 0;
  if (courseId && enrollmentToAdd) {
    const { error: enrErr } = await admin.from("enrollments").insert({
      course_id: courseId,
      student_id: studentId,
    });
    if (!enrErr) enrolled = 1;
    else {
      const dup =
        enrErr.code === "23505" ||
        (enrErr.message?.toLowerCase().includes("duplicate") ?? false);
      if (!dup) {
        return { outcome: { kind: "fail", message: IMPORT_ROW_ENROLLMENT_FAILED }, emailMap: map };
      }
    }
  }

  const fee =
    row.monthly_fee != null && !Number.isNaN(Number(row.monthly_fee))
      ? Number(row.monthly_fee)
      : 0;
  let paymentsSeeded = 0;
  if (paymentsToSeed) {
    paymentsSeeded = await seedPayments2026(admin, studentId, parentId, fee);
  }

  return {
    outcome: {
      kind: "ok",
      message: IMPORT_ROW_SUCCESS,
      createdUsers,
      profilesUpdated,
      enrolled,
      paymentsSeeded,
      skippedNoop: 0,
    },
    emailMap: map,
  };
}
