import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExistingProfileForUsersSpreadsheet } from "@/lib/users/classifyUsersSpreadsheetRows";
import { chunkedIn } from "@/lib/supabase/chunkedIn";

/**
 * Resolve existing profiles that collide with spreadsheet emails/DNIs.
 * One Auth list pass (bounded) for emails; chunked profile `.in` for DNIs.
 */
export async function loadExistingProfilesForUsersSpreadsheet(
  admin: SupabaseClient,
  emails: string[],
  dnis: string[],
): Promise<ExistingProfileForUsersSpreadsheet[]> {
  const emailNeed = new Set(
    emails.map((e) => e.trim().toLowerCase()).filter((e) => e.length > 0),
  );
  const emailToId = new Map<string, string>();

  if (emailNeed.size > 0) {
    let page = 1;
    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (error) break;
      const batch = data?.users ?? [];
      for (const u of batch) {
        const em = (u.email ?? "").trim().toLowerCase();
        if (em && emailNeed.has(em) && !emailToId.has(em)) {
          emailToId.set(em, u.id);
        }
      }
      if (emailToId.size >= emailNeed.size) break;
      if (batch.length < 1000) break;
      page += 1;
    }
  }

  const byId = new Map<string, ExistingProfileForUsersSpreadsheet>();

  for (const [email, id] of emailToId) {
    byId.set(id, { id, email, dni_or_passport: null });
  }

  const dniList = [
    ...new Set(dnis.map((d) => d.trim()).filter((d) => d.length > 0)),
  ];
  if (dniList.length > 0) {
    const rows = await chunkedIn<{
      id: string;
      dni_or_passport: string | null;
    }>(admin, "profiles", "dni_or_passport", dniList, "id, dni_or_passport");
    for (const r of rows) {
      const prev = byId.get(r.id);
      byId.set(r.id, {
        id: r.id,
        email: prev?.email ?? null,
        dni_or_passport: r.dni_or_passport,
      });
    }
  }

  const idsNeedingDni = [...byId.values()]
    .filter((p) => p.dni_or_passport == null)
    .map((p) => p.id);
  if (idsNeedingDni.length > 0) {
    const rows = await chunkedIn<{ id: string; dni_or_passport: string | null }>(
      admin,
      "profiles",
      "id",
      idsNeedingDni,
      "id, dni_or_passport",
    );
    for (const r of rows) {
      const prev = byId.get(r.id);
      if (!prev) continue;
      byId.set(r.id, { ...prev, dni_or_passport: r.dni_or_passport });
    }
  }

  return [...byId.values()];
}
