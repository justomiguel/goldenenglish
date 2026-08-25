import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeRegistrationDocument } from "@/lib/register/normalizeRegistrationDocument";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

function documentKey(raw: string): string {
  return normalizeRegistrationDocument(raw).toLowerCase();
}

/**
 * Maps each lead id to an existing student profile id when the document
 * matches a student. Non-student roles are ignored (not exposed as a match).
 */
export async function resolveExistingStudentIdsForLeads(
  admin: SupabaseClient,
  leads: { id: string; dni: string }[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (leads.length === 0) return result;

  const variants = new Set<string>();
  for (const lead of leads) {
    const raw = lead.dni.trim();
    const norm = normalizeRegistrationDocument(lead.dni);
    if (raw) variants.add(raw);
    if (norm) variants.add(norm);
  }
  if (variants.size === 0) return result;

  const { data, error } = await admin
    .from("profiles")
    .select("id, role, dni_or_passport")
    .eq("role", "student")
    .in("dni_or_passport", [...variants]);

  if (error) {
    logSupabaseClientError("resolveExistingStudentIdsForLeads", error);
    return result;
  }

  const studentByKey = new Map<string, string>();
  for (const row of data ?? []) {
    const key = documentKey(String(row.dni_or_passport ?? ""));
    if (key) studentByKey.set(key, String(row.id));
  }

  for (const lead of leads) {
    const id = studentByKey.get(documentKey(lead.dni));
    if (id) result.set(lead.id, id);
  }
  return result;
}
