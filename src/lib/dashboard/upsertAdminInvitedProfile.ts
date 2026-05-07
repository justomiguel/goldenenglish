import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminInvitedProfileFields = {
  userId: string;
  role: "admin" | "teacher" | "student" | "parent" | "assistant";
  first_name: string;
  last_name: string;
  dni_or_passport: string | null;
  phone: string | null;
  birth_date: string | undefined;
};

export function buildAdminInvitedProfileRow(fields: AdminInvitedProfileFields) {
  const birthDate = fields.birth_date?.trim();
  return {
    id: fields.userId,
    role: fields.role,
    first_name: fields.first_name,
    last_name: fields.last_name,
    dni_or_passport: fields.dni_or_passport,
    phone: fields.phone,
    birth_date: birthDate && birthDate.length >= 10 ? birthDate.slice(0, 10) : null,
  };
}

export async function upsertAdminInvitedProfile(
  admin: SupabaseClient,
  fields: AdminInvitedProfileFields,
): Promise<{ error: { message: string; code?: string } | null }> {
  const { error } = await admin
    .from("profiles")
    .upsert(buildAdminInvitedProfileRow(fields), { onConflict: "id" });
  return { error: error ? { message: error.message, code: error.code } : null };
}
