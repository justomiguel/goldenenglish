import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkedIn } from "@/lib/supabase/chunkedIn";

const PARENT_ROLE = "parent";

export type AdminUserDeletionPlan = {
  /** Delete in this sequence: linked students before guardians to avoid orphaned links/tutor rows. */
  orderedIds: string[];
  cascadeStudentIds: string[];
  parentTutorTriggers: string[];
  addedStudentCount: number;
};

async function profilesByIds(
  admin: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const rows = await chunkedIn<{ id: string; role?: string | null }>(
    admin,
    "profiles",
    "id",
    ids,
    "id,role",
  );
  for (const r of rows) {
    map.set(String(r.id), String(r.role ?? ""));
  }
  return map;
}

/**
 * Requests admin bulk delete of user IDs. Parents (`role === parent`) also expand to every
 * `tutor_student_rel.student_id` for those tutors before producing a deterministic delete order.
 */
export async function buildAdminUserDeletionPlan(
  admin: SupabaseClient,
  requestedDistinctNoActor: string[],
): Promise<AdminUserDeletionPlan | { error: "empty" }> {
  const base = [...new Set(requestedDistinctNoActor.filter(Boolean))];
  if (base.length === 0) return { error: "empty" };

  const baseRoles = await profilesByIds(admin, base);

  const parentTutorTriggers = base.filter((id) => baseRoles.get(id)?.toLowerCase() === PARENT_ROLE);

  let cascadeStudentIds: string[] = [];
  if (parentTutorTriggers.length > 0) {
    const rows = await chunkedIn<{ student_id: string }>(
      admin,
      "tutor_student_rel",
      "tutor_id",
      parentTutorTriggers,
      "student_id",
    );
    cascadeStudentIds = [...new Set(rows.map((row) => String(row.student_id)))];
  }

  const expandedUniq = [...new Set([...base, ...cascadeStudentIds])];
  const roleMap = await profilesByIds(admin, expandedUniq);
  const cascadeSet = new Set(cascadeStudentIds);
  const addedStudentCount = cascadeStudentIds.filter((sid) => !base.includes(sid)).length;

  function studentFirstTier(id: string): 0 | 1 {
    const rl = roleMap.get(id)?.toLowerCase();
    const isStudentPhase = rl === "student" || cascadeSet.has(id);
    return isStudentPhase ? 0 : 1;
  }

  expandedUniq.sort((a, b) => {
    const da = studentFirstTier(a);
    const db = studentFirstTier(b);
    if (da !== db) return da - db;
    return a.localeCompare(b);
  });

  return {
    orderedIds: expandedUniq,
    cascadeStudentIds,
    parentTutorTriggers,
    addedStudentCount,
  };
}
