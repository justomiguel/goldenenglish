type CohortCell = { name: string; archived_at?: string | null } | { name: string; archived_at?: string | null }[] | null;

type SectionMoveRow = {
  id: string;
  name: string;
  archived_at: string | null;
  academic_cohorts: CohortCell;
};

/** Builds `{ id, label }` move targets from a bounded `academic_sections` list (admin UI). */
export function buildAdminSectionMoveTargets(
  allSections: unknown[] | null | undefined,
  excludeSectionId: string,
): { id: string; label: string }[] {
  return (
    (allSections ?? [])
      .map((raw) => {
        const r = raw as SectionMoveRow;
        const c = r.academic_cohorts;
        const cn = Array.isArray(c) ? (c[0]?.name ?? "") : (c?.name ?? "");
        const cohortArch = Array.isArray(c) ? (c[0]?.archived_at ?? null) : (c?.archived_at ?? null);
        return {
          id: r.id,
          label: `${cn} — ${r.name}`,
          ok: r.id !== excludeSectionId && r.archived_at == null && cohortArch == null,
        };
      })
      .filter((x) => x.ok)
      .map(({ id, label }) => ({ id, label })) ?? []
  );
}
