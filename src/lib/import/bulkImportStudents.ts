import type { SupabaseClient } from "@supabase/supabase-js";
import type { CsvStudentRow } from "@/lib/import/studentRowSchema";
import { defaultEmail, normalizeDni } from "@/lib/import/studentImportUtils";
import { loadAuthEmailMap } from "@/lib/import/authEmailMap";
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

export type ImportRowResult = { rowIndex: number; ok: boolean; message: string };

export type BulkImportResult = {
  processed: number;
  createdUsers: number;
  enrolled: number;
  paymentsSeeded: number;
  profilesUpdated: number;
  skippedNoop: number;
  results: ImportRowResult[];
};

function inviteMeta(
  base: Record<string, string>,
  role: "student" | "parent",
): Record<string, unknown> {
  return { ...base, provisioning_source: "admin_invite", role };
}

function isDuplicateAuthError(err: { message?: string } | null | undefined): boolean {
  const m = err?.message?.toLowerCase() ?? "";
  return (
    m.includes("already been registered") ||
    m.includes("already registered") ||
    m.includes("user already registered") ||
    m.includes("duplicate key value") ||
    m.includes("email address has already")
  );
}

export async function bulkImportStudentsFromRowsAdmin(
  admin: SupabaseClient,
  rows: CsvStudentRow[],
): Promise<BulkImportResult> {
  const results: ImportRowResult[] = [];
  let createdUsers = 0;
  let enrolled = 0;
  let paymentsSeeded = 0;
  let profilesUpdated = 0;
  let skippedNoop = 0;

  let emailMap = await loadAuthEmailMap(admin);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 1;
    try {
      const { dni, password } = normalizeDni(row.dni_or_passport);
      const emailNorm = (row.email?.trim() || defaultEmail(dni)).toLowerCase();
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

      const uidByEmail = emailMap.get(emailNorm);
      const { data: byDni } = await admin
        .from("profiles")
        .select("id, role, dni_or_passport, phone, birth_date")
        .eq("dni_or_passport", dni)
        .maybeSingle();

      if (uidByEmail && byDni?.id && uidByEmail !== byDni.id) {
        results.push({
          rowIndex,
          ok: false,
          message: "El email y el DNI corresponden a usuarios distintos",
        });
        continue;
      }

      let studentId: string | null = null;

      if (uidByEmail) {
        studentId = uidByEmail;
      } else if (byDni?.id) {
        studentId = byDni.id as string;
      } else {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: emailNorm,
          password,
          email_confirm: true,
          user_metadata: studentMeta,
        });

        if (createErr) {
          if (isDuplicateAuthError(createErr)) {
            emailMap = await loadAuthEmailMap(admin);
            const retryId = emailMap.get(emailNorm);
            if (retryId) {
              studentId = retryId;
            } else {
              results.push({ rowIndex, ok: false, message: createErr.message });
              continue;
            }
          } else {
            results.push({ rowIndex, ok: false, message: createErr.message });
            continue;
          }
        } else if (created?.user) {
          studentId = created.user.id;
          createdUsers += 1;
          emailMap.set(emailNorm, studentId);
        }
      }

      if (!studentId) {
        results.push({ rowIndex, ok: false, message: "No user id" });
        continue;
      }

      const { data: profile, error: profErr } = await admin
        .from("profiles")
        .select("id, role, phone, birth_date, dni_or_passport")
        .eq("id", studentId)
        .single();

      if (profErr || !profile) {
        results.push({ rowIndex, ok: false, message: profErr?.message ?? "Sin perfil" });
        continue;
      }

      if (profile.role !== "student") {
        results.push({
          rowIndex,
          ok: false,
          message: "El usuario ya existe con otro rol (no alumno)",
        });
        continue;
      }

      const merge = mergeStudentProfileCsvPatch(profile as ProfileForMerge, row, dni);
      if (merge.dniConflict) {
        results.push({
          rowIndex,
          ok: false,
          message: "El email ya está registrado con otro documento (DNI)",
        });
        continue;
      }

      const courseId = await resolveCourseId(admin, row);
      let enrollmentToAdd = false;
      if (courseId) {
        enrollmentToAdd = !(await enrollmentExists(admin, studentId, courseId));
      }
      const paymentsToSeed = !(await hasPaymentsForYear(admin, studentId, 2026));

      if (!merge.hasNew && !enrollmentToAdd && !paymentsToSeed) {
        skippedNoop += 1;
        results.push({ rowIndex, ok: true, message: "Sin novedades" });
        continue;
      }

      if (merge.hasNew) {
        const { error: upErr } = await admin
          .from("profiles")
          .update(merge.patch)
          .eq("id", studentId);
        if (upErr) {
          results.push({ rowIndex, ok: false, message: upErr.message });
          continue;
        }
        profilesUpdated += 1;
      }

      const parentId = await ensureParentUserId(admin, row);
      if (parentId) await linkParentStudent(admin, parentId, studentId);

      if (courseId && enrollmentToAdd) {
        const { error: enrErr } = await admin.from("enrollments").insert({
          course_id: courseId,
          student_id: studentId,
        });
        if (!enrErr) enrolled += 1;
        else {
          const dup =
            enrErr.code === "23505" ||
            (enrErr.message?.toLowerCase().includes("duplicate") ?? false);
          if (!dup) {
            results.push({ rowIndex, ok: false, message: enrErr.message });
            continue;
          }
        }
      }

      const fee =
        row.monthly_fee != null && !Number.isNaN(Number(row.monthly_fee))
          ? Number(row.monthly_fee)
          : 0;
      if (paymentsToSeed) {
        paymentsSeeded += await seedPayments2026(admin, studentId, parentId, fee);
      }

      results.push({ rowIndex, ok: true, message: "OK" });
    } catch (e) {
      results.push({
        rowIndex,
        ok: false,
        message: e instanceof Error ? e.message : "Error",
      });
    }
  }

  return {
    processed: rows.length,
    createdUsers,
    enrolled,
    paymentsSeeded,
    profilesUpdated,
    skippedNoop,
    results,
  };
}
