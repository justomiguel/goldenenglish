"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  csvStudentRowsSchema,
  type CsvStudentRow,
} from "@/lib/import/studentRowSchema";

export type ImportRowResult = { rowIndex: number; ok: boolean; message: string };

export type BulkImportResult = {
  processed: number;
  createdUsers: number;
  enrolled: number;
  results: ImportRowResult[];
};

function normalizeDni(raw: string): { dni: string; password: string } {
  const d = raw.replace(/\./g, "").replace(/\s/g, "").trim();
  const password = d.length >= 6 ? d : d.padEnd(6, "0");
  return { dni: d, password };
}

function defaultEmail(dni: string): string {
  const safe = dni.replace(/[^\dA-Za-z]/g, "").toLowerCase() || "sin-doc";
  return `${safe}@students.goldenenglish.local`;
}

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") throw new Error("Forbidden");
}

async function resolveCourseId(
  admin: ReturnType<typeof createAdminClient>,
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
  return data.id;
}

export async function bulkImportStudentsFromRows(
  rows: unknown[],
): Promise<BulkImportResult> {
  await assertAdmin();

  const parsed = csvStudentRowsSchema.safeParse(rows);
  if (!parsed.success) {
    throw new Error("Invalid CSV payload");
  }

  const admin = createAdminClient();
  const results: ImportRowResult[] = [];
  let createdUsers = 0;
  let enrolled = 0;

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const rowIndex = i + 1;

    try {
      const { dni, password } = normalizeDni(row.dni_or_passport);
      const email = (row.email?.trim() || defaultEmail(dni)).toLowerCase();

      const meta = {
        first_name: row.first_name,
        last_name: row.last_name,
        dni_or_passport: dni,
        phone: row.phone ?? "",
        birth_date: row.birth_date ?? "",
      };

      let userId: string | null = null;

      const { data: byDoc } = await admin
        .from("profiles")
        .select("id")
        .eq("dni_or_passport", dni)
        .maybeSingle();

      if (byDoc?.id) {
        userId = byDoc.id;
      } else {
        const { data: created, error: createErr } =
          await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: meta,
          });

        if (createErr) {
          results.push({
            rowIndex,
            ok: false,
            message: createErr.message,
          });
          continue;
        }
        if (created.user) {
          userId = created.user.id;
          createdUsers += 1;
        }
      }

      if (!userId) {
        results.push({ rowIndex, ok: false, message: "No user id" });
        continue;
      }

      const courseId = await resolveCourseId(admin, row);
      if (courseId) {
        const { error: enrErr } = await admin.from("enrollments").insert({
          course_id: courseId,
          student_id: userId,
        });
        if (!enrErr) enrolled += 1;
        else {
          const dup =
            enrErr.code === "23505" ||
            (enrErr.message?.toLowerCase().includes("duplicate") ?? false);
          if (!dup) {
            results.push({
              rowIndex,
              ok: false,
              message: enrErr.message,
            });
            continue;
          }
        }
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
    processed: parsed.data.length,
    createdUsers,
    enrolled,
    results,
  };
}
