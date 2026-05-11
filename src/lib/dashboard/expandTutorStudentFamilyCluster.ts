/** Undirected household cluster via `tutor_student_rel` edges (tutor ↔ student). */
export type TutorStudentEdge = { tutor_id: string; student_id: string };

/**
 * Returns every profile id in the connected component containing `seedUserId`.
 * Used server-side after fetching bounded edges and for unit tests.
 */
export function expandTutorStudentFamilyClusterFromEdges(
  seedUserId: string,
  edges: readonly TutorStudentEdge[],
): string[] {
  const cluster = new Set<string>([seedUserId]);
  let frontier = new Set<string>([seedUserId]);
  for (let i = 0; i < 50 && frontier.size > 0; i++) {
    const next = new Set<string>();
    for (const e of edges) {
      const t = String(e.tutor_id);
      const s = String(e.student_id);
      if (frontier.has(t) && !cluster.has(s)) {
        cluster.add(s);
        next.add(s);
      }
      if (frontier.has(s) && !cluster.has(t)) {
        cluster.add(t);
        next.add(t);
      }
    }
    frontier = next;
  }
  return [...cluster];
}
