import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeRegistrationDocument } from "@/lib/register/normalizeRegistrationDocument";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type ExistingStudentResolution =
  | { kind: "none" }
  | { kind: "student"; studentId: string; email: string }
  | { kind: "occupied" };

function documentKey(raw: string): string {
  return normalizeRegistrationDocument(raw).toLowerCase();
}

export async function resolveExistingStudentByDni(
  admin: SupabaseClient,
  dni: string,
): Promise<ExistingStudentResolution> {
  const key = documentKey(dni);
  if (!key) return { kind: "none" };

  const raw = dni.trim();
  const norm = normalizeRegistrationDocument(dni);
  const variants = [...new Set([raw, norm].filter(Boolean))];
  const filter = variants.map((v) => `dni_or_passport.eq.${v}`).join(",");

  const { data, error } = await admin
    .from("profiles")
    .select("id, role, dni_or_passport")
    .or(filter)
    .limit(5);

  if (error) {
    logSupabaseClientError("resolveExistingStudentByDni:profiles", error);
    return { kind: "none" };
  }

  const rows = (data ?? []).filter(
    (row) => documentKey(String(row.dni_or_passport ?? "")) === key,
  );
  if (rows.length === 0) return { kind: "none" };

  const student = rows.find((row) => row.role === "student");
  if (!student) return { kind: "occupied" };

  const { data: authData, error: authError } = await admin.auth.admin.getUserById(
    String(student.id),
  );
  if (authError) {
    logSupabaseClientError("resolveExistingStudentByDni:getUserById", authError, {
      profileId: String(student.id),
    });
    return { kind: "none" };
  }

  const email = authData.user?.email?.trim().toLowerCase() ?? "";
  return { kind: "student", studentId: String(student.id), email };
}
