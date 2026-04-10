import type { SupabaseClient } from "@supabase/supabase-js";
import type { CsvStudentRow } from "@/lib/import/studentRowSchema";
import { defaultEmail, normalizeDni } from "@/lib/import/studentImportUtils";
import { parentDefaultEmail } from "@/lib/import/parentDefaultEmail";

export type ImportRowResult = { rowIndex: number; ok: boolean; message: string };

export type BulkImportResult = {
  processed: number;
  createdUsers: number;
  enrolled: number;
  paymentsSeeded: number;
  results: ImportRowResult[];
};

function inviteMeta(
  base: Record<string, string>,
  role: "student" | "parent",
): Record<string, unknown> {
  return { ...base, provisioning_source: "admin_invite", role };
}

async function resolveCourseId(
  admin: SupabaseClient,
  row: CsvStudentRow,
): Promise<string | null> {
  if (!row.level) return null;
  const year = row.academic_year ?? 2026;
  const { data, error } = await admin
    .from("courses")
    .select("id")
    .eq("level", row.level)
    .eq("academic_year", year)
    .eq("modality", "online")
    .maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

async function ensureParentUserId(
  admin: SupabaseClient,
  row: CsvStudentRow,
): Promise<string | null> {
  const raw = row.tutor_dni?.trim();
  if (!raw) return null;
  const { dni, password } = normalizeDni(raw);
  const email = (row.tutor_email?.trim() || parentDefaultEmail(dni)).toLowerCase();
  const meta = inviteMeta(
    {
      first_name: row.tutor_first_name?.trim() || "Tutor",
      last_name: row.tutor_last_name?.trim() || "—",
      dni_or_passport: dni,
      phone: row.tutor_phone?.trim() || "",
      birth_date: "",
    },
    "parent",
  );

  const { data: existing } = await admin
    .from("profiles")
    .select("id, role")
    .eq("dni_or_passport", dni)
    .maybeSingle();

  if (existing?.id) {
    if (existing.role === "parent" || existing.role === "admin") {
      return existing.id as string;
    }
    return null;
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error || !created.user) return null;
  return created.user.id;
}

async function linkParentStudent(
  admin: SupabaseClient,
  parentId: string,
  studentId: string,
) {
  await admin.from("parent_student").upsert(
    { parent_id: parentId, student_id: studentId },
    { onConflict: "parent_id,student_id" },
  );
}

async function hasPaymentsForYear(
  admin: SupabaseClient,
  studentId: string,
  year: number,
): Promise<boolean> {
  const { data } = await admin
    .from("payments")
    .select("id")
    .eq("student_id", studentId)
    .eq("year", year)
    .limit(1)
    .maybeSingle();
  return data != null;
}

async function seedPayments2026(
  admin: SupabaseClient,
  studentId: string,
  parentId: string | null,
  amount: number,
): Promise<number> {
  let n = 0;
  const year = 2026;
  for (let month = 1; month <= 12; month++) {
    const { error } = await admin.from("payments").insert({
      parent_id: parentId,
      student_id: studentId,
      month,
      year,
      amount,
      status: "pending",
    });
    if (!error) n += 1;
  }
  return n;
}

export async function bulkImportStudentsFromRowsAdmin(
  admin: SupabaseClient,
  rows: CsvStudentRow[],
): Promise<BulkImportResult> {
  const results: ImportRowResult[] = [];
  let createdUsers = 0;
  let enrolled = 0;
  let paymentsSeeded = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 1;
    try {
      const { dni, password } = normalizeDni(row.dni_or_passport);
      const email = (row.email?.trim() || defaultEmail(dni)).toLowerCase();
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

      let studentId: string | null = null;
      const { data: byDoc } = await admin
        .from("profiles")
        .select("id")
        .eq("dni_or_passport", dni)
        .maybeSingle();

      if (byDoc?.id) {
        studentId = byDoc.id as string;
      } else {
        const { data: created, error: createErr } =
          await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: studentMeta,
          });
        if (createErr) {
          results.push({ rowIndex, ok: false, message: createErr.message });
          continue;
        }
        if (created.user) {
          studentId = created.user.id;
          createdUsers += 1;
        }
      }

      if (!studentId) {
        results.push({ rowIndex, ok: false, message: "No user id" });
        continue;
      }

      const parentId = await ensureParentUserId(admin, row);
      if (parentId) await linkParentStudent(admin, parentId, studentId);

      const courseId = await resolveCourseId(admin, row);
      if (courseId) {
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
      if (!(await hasPaymentsForYear(admin, studentId, 2026))) {
        paymentsSeeded += await seedPayments2026(
          admin,
          studentId,
          parentId,
          fee,
        );
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
    results,
  };
}
