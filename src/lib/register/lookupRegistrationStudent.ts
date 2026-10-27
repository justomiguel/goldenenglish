import { createClient } from "@/lib/supabase/server";
import { normalizeRegistrationDocument } from "@/lib/register/normalizeRegistrationDocument";
import { isDeliverableAuthEmail } from "@/lib/auth/isSyntheticAuthEmail";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type LookupRegistrationStudentFound = {
  ok: true;
  found: true;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  email: string;
  tutorName: string;
  tutorDni: string;
  tutorEmail: string;
  tutorPhone: string;
  tutorRelationship: string;
};

export type LookupRegistrationStudentResult =
  | { ok: true; found: false }
  | LookupRegistrationStudentFound
  | { ok: false };

function cleanDeliverableEmail(raw: unknown): string {
  const str = String(raw ?? "").trim();
  return isDeliverableAuthEmail(str) ? str : "";
}

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
    birthDate: String(row.birth_date ?? "").slice(0, 10),
    phone: String(row.phone ?? "").trim(),
    email: cleanDeliverableEmail(row.email),
    tutorName: String(row.tutor_name ?? "").trim(),
    tutorDni: String(row.tutor_dni ?? "").trim(),
    tutorEmail: cleanDeliverableEmail(row.tutor_email),
    tutorPhone: String(row.tutor_phone ?? "").trim(),
    tutorRelationship: String(row.tutor_relationship ?? "").trim(),
  };
}
