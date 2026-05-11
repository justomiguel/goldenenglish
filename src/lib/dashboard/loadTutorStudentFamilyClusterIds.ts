import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_GRAPH_EXPAND_ITERATIONS = 28;

/**
 * Loads all profile ids in the same tutor↔student link component as `userId`.
 * Bounded iterations; each step only queries rows touching the current frontier (Rule 13).
 */
export async function loadTutorStudentFamilyClusterIds(
  admin: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const cluster = new Set<string>([userId]);
  let frontier = new Set<string>([userId]);

  for (let i = 0; i < MAX_GRAPH_EXPAND_ITERATIONS && frontier.size > 0; i++) {
    const ids = [...frontier];
    const [{ data: asTutor }, { data: asStudent }] = await Promise.all([
      admin.from("tutor_student_rel").select("tutor_id,student_id").in("tutor_id", ids),
      admin.from("tutor_student_rel").select("tutor_id,student_id").in("student_id", ids),
    ]);

    const seen = new Set<string>();
    const edges: { tutor_id: string; student_id: string }[] = [];
    for (const r of [...(asTutor ?? []), ...(asStudent ?? [])]) {
      const t = String(r.tutor_id);
      const s = String(r.student_id);
      const key = `${t}:${s}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ tutor_id: t, student_id: s });
    }

    const nextFrontier = new Set<string>();
    for (const e of edges) {
      if (frontier.has(e.tutor_id) && !cluster.has(e.student_id)) {
        cluster.add(e.student_id);
        nextFrontier.add(e.student_id);
      }
      if (frontier.has(e.student_id) && !cluster.has(e.tutor_id)) {
        cluster.add(e.tutor_id);
        nextFrontier.add(e.tutor_id);
      }
    }
    frontier = nextFrontier;
  }

  return [...cluster];
}
