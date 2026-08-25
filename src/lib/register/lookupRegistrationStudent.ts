import { createClient } from "@/lib/supabase/server";
import { normalizeRegistrationDocument } from "@/lib/register/normalizeRegistrationDocument";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type LookupRegistrationStudentResult =
  | { ok: true; found: false }
  | { ok: true; found: true; firstName: string; lastName: string }
  | { ok: false };

export async function lookupRegistrationStudent(
  dni: string,
): Promise<LookupRegistrationStudentResult> {
  if (!normalizeRegistrationDocument(dni)) {
    return { ok: true, found: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_registration_student", {
    p_dni: dni,
  });

  if (error) {
    logSupabaseClientError("lookupRegistrationStudent", error);
    return { ok: false };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.found !== true) {
    return { ok: true, found: false };
  }

  return {
    ok: true,
    found: true,
    firstName: String(row.first_name ?? ""),
    lastName: String(row.last_name ?? ""),
  };
}
