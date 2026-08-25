import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSectionEnrollmentPreview } from "@/lib/academics/buildSectionEnrollmentPreview";
import { commitSectionEnrollmentRpc } from "@/lib/academics/commitSectionEnrollmentRpc";

/**
 * Enrols each requested academic section without capacity override.
 * `ALREADY_ACTIVE` is success (skip). Other failures stay pending.
 *
 * `supabase` must be the admin's signed-in session. The commit RPC checks
 * `is_admin(auth.uid())` and rejects the service-role client.
 */
export async function enrollRequestedSectionsOnAccept(
  admin: SupabaseClient,
  studentId: string,
  sectionIds: string[],
): Promise<string[]> {
  const pending: string[] = [];
  const seen = new Set<string>();

  for (const raw of sectionIds) {
    const sectionId = raw.trim();
    if (!sectionId || seen.has(sectionId)) continue;
    seen.add(sectionId);

    const preview = await buildSectionEnrollmentPreview(admin, {
      studentId,
      sectionId,
      ignoreCapacity: false,
    });
    if (!preview.ok) {
      if (preview.code === "ALREADY_ACTIVE") continue;
      pending.push(sectionId);
      continue;
    }

    const committed = await commitSectionEnrollmentRpc(admin, {
      studentId,
      sectionId,
      dropId: null,
      dropNext: "dropped",
      allowCapacityOverride: false,
    });
    if (!committed.ok) {
      if (committed.code === "ALREADY_ACTIVE") continue;
      pending.push(sectionId);
    }
  }

  return pending;
}
