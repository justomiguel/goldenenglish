import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeDni } from "@/lib/import/studentImportUtils";
import { parentDefaultEmail } from "@/lib/import/parentDefaultEmail";

function inviteMetaParent(fields: Record<string, string>): Record<string, unknown> {
  return { ...fields, provisioning_source: "admin_invite", role: "parent" };
}

export type EnsureParentProfileResult =
  | { ok: true; parentId: string }
  | { ok: false; message: string };

/**
 * Creates or reuses a parent/tutor profile by national ID (same semantics as CSV import).
 */
export async function ensureParentProfileByTutorDni(
  admin: SupabaseClient,
  input: {
    tutorDniRaw: string;
    tutorEmail: string | null | undefined;
    tutorPhone: string | null | undefined;
    tutorFirstName: string;
    tutorLastName: string;
  },
): Promise<EnsureParentProfileResult> {
  const raw = input.tutorDniRaw.trim();
  if (!raw) {
    return { ok: false, message: "tutor_dni_required" };
  }
  const { dni, password } = normalizeDni(raw);
  const email = (input.tutorEmail?.trim() || parentDefaultEmail(dni)).toLowerCase();
  const meta = inviteMetaParent({
    first_name: input.tutorFirstName.trim(),
    last_name: input.tutorLastName.trim(),
    dni_or_passport: dni,
    phone: input.tutorPhone?.trim() || "",
    birth_date: "",
  });

  const { data: existing } = await admin
    .from("profiles")
    .select("id, role")
    .eq("dni_or_passport", dni)
    .maybeSingle();

  if (existing?.id) {
    if (existing.role === "parent" || existing.role === "admin") {
      return { ok: true, parentId: existing.id as string };
    }
    return { ok: false, message: "tutor_dni_in_use_by_student" };
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) return { ok: false, message: "auth_failed" };
  if (!created.user) return { ok: false, message: "no_user_returned" };
  return { ok: true, parentId: created.user.id };
}

export async function upsertTutorStudentLink(
  admin: SupabaseClient,
  tutorId: string,
  studentId: string,
  relationship: string | null | undefined,
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await admin.from("tutor_student_rel").upsert(
    {
      tutor_id: tutorId,
      student_id: studentId,
      relationship: relationship?.trim() || null,
    },
    { onConflict: "tutor_id,student_id" },
  );
  if (error) return { ok: false, message: "link_failed" };
  return { ok: true };
}
