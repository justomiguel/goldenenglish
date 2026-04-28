import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminTransferInboxRow } from "@/types/adminTransferInbox";
import {
  compareProfileSnakeByLastThenFirst,
  formatProfileSnakeSurnameFirst,
} from "@/lib/profile/formatProfileDisplayName";

function labelFromProfile(p: { first_name: string; last_name: string } | null | undefined, id: string) {
  if (!p) return id;
  return formatProfileSnakeSurnameFirst(p, id);
}

/**
 * Pending section transfer requests. When `cohortId` is set, only requests whose
 * from- or to-section belongs to that cohort are returned.
 */
export async function loadAdminTransferInboxRows(
  supabase: SupabaseClient,
  locale: string,
  options: { cohortId?: string } = {},
): Promise<AdminTransferInboxRow[]> {
  let cohortSectionIds: Set<string> | null = null;
  if (options.cohortId) {
    const { data: secs } = await supabase
      .from("academic_sections")
      .select("id")
      .eq("cohort_id", options.cohortId);
    const ids = ((secs ?? []) as { id: string }[]).map((s) => s.id);
    cohortSectionIds = new Set(ids);
    if (ids.length === 0) return [];
  }

  const { data: reqs } = await supabase
    .from("section_transfer_requests")
    .select("id, student_id, from_section_id, to_section_id, requested_by, note, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const listRaw = (reqs ?? []) as {
    id: string;
    student_id: string;
    from_section_id: string;
    to_section_id: string;
    requested_by: string;
    note: string | null;
    created_at: string;
  }[];

  const list =
    cohortSectionIds == null
      ? listRaw
      : listRaw.filter(
          (r) =>
            cohortSectionIds!.has(r.from_section_id) || cohortSectionIds!.has(r.to_section_id),
        );

  const profileIds = new Set<string>();
  const sectionIds = new Set<string>();
  for (const r of list) {
    profileIds.add(r.student_id);
    profileIds.add(r.requested_by);
    sectionIds.add(r.from_section_id);
    sectionIds.add(r.to_section_id);
  }

  if (list.length === 0) return [];

  const [{ data: profiles }, { data: sections }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name").in("id", [...profileIds]),
    supabase
      .from("academic_sections")
      .select("id, name, academic_cohorts(name)")
      .in("id", [...sectionIds]),
  ]);

  const profMap = new Map(
    (profiles ?? []).map((p) => {
      const row = p as { id: string; first_name: string; last_name: string };
      return [row.id, row];
    }),
  );
  const secMap = new Map(
    (sections ?? []).map((s) => {
      const row = s as {
        id: string;
        name: string;
        academic_cohorts: { name: string } | { name: string }[] | null;
      };
      const c = row.academic_cohorts;
      const cn = Array.isArray(c) ? (c[0]?.name ?? "") : (c?.name ?? "");
      return [row.id, `${cn} — ${row.name}`];
    }),
  );

  const df = new Intl.DateTimeFormat(locale === "es" ? "es" : "en", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const mapped = list.map((r) => ({
    id: r.id,
    studentLabel: labelFromProfile(profMap.get(r.student_id), r.student_id),
    fromLabel: secMap.get(r.from_section_id) ?? r.from_section_id,
    toLabel: secMap.get(r.to_section_id) ?? r.to_section_id,
    byLabel: labelFromProfile(profMap.get(r.requested_by), r.requested_by),
    note: r.note,
    createdAt: df.format(new Date(r.created_at)),
    _studentProf: profMap.get(r.student_id) ?? null,
  }));
  mapped.sort((a, b) => {
    if (!a._studentProf && !b._studentProf) return 0;
    if (!a._studentProf) return 1;
    if (!b._studentProf) return -1;
    return compareProfileSnakeByLastThenFirst(a._studentProf, b._studentProf);
  });
  return mapped.map(({ _studentProf, ...row }) => row);
}
