import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { SECTION_LEAD_TEACHER_ELIGIBLE_ROLES } from "@/lib/academics/sectionStaffEligibleRoles";
import {
  compareProfileSnakeByLastThenFirst,
  formatProfileSnakeSurnameFirst,
} from "@/lib/profile/formatProfileDisplayName";

export type SectionStaffTeacherOption = { id: string; label: string };

/** Portal pick-list: classroom teachers plus dedicated `assistant` profiles. */
export type SectionStaffPortalPickOption = { id: string; label: string; role: "teacher" | "assistant" };

export type SectionStaffProfileAssistant = { id: string; label: string; role: string };

export type SectionStaffExternalOption = { id: string; label: string };

/** Teachers pick-list (incl. titular if missing from role=teacher slice) + current assistants for admin section page. */
export async function loadAdminSectionTeachersAndAssistants(
  supabase: SupabaseClient,
  sectionId: string,
  leadTeacherId: string,
): Promise<{
  teachers: SectionStaffTeacherOption[];
  assistantPortalStaffOptions: SectionStaffPortalPickOption[];
  initialAssistants: SectionStaffProfileAssistant[];
  initialExternalAssistants: SectionStaffExternalOption[];
}> {
  const [{ data: teacherRows }, { data: portalAssistantRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("role", [...SECTION_LEAD_TEACHER_ELIGIBLE_ROLES])
      .order("last_name", { ascending: true })
      .limit(200),
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("role", "assistant")
      .order("last_name", { ascending: true })
      .limit(120),
  ]);

  const teachers: SectionStaffTeacherOption[] =
    (teacherRows ?? []).map((p) => {
      const r = p as { id: string; first_name: string; last_name: string };
      return { id: r.id, label: formatProfileSnakeSurnameFirst(r) };
    }) ?? [];

  const assistantPortalStaffOptions: SectionStaffPortalPickOption[] = (() => {
    const m = new Map<string, { label: string; role: "teacher" | "assistant" }>();
    for (const t of teachers) m.set(t.id, { label: t.label, role: "teacher" });
    for (const p of portalAssistantRows ?? []) {
      const r = p as { id: string; first_name: string; last_name: string };
      const label = formatProfileSnakeSurnameFirst(r);
      if (!m.has(r.id)) m.set(r.id, { label, role: "assistant" });
    }
    return [...m.entries()]
      .map(([id, v]) => ({ id, label: v.label, role: v.role }))
      .sort((a, b) => a.label.localeCompare(b.label));
  })();

  if (!teachers.some((t) => t.id === leadTeacherId)) {
    const { data: leadRow } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("id", leadTeacherId)
      .maybeSingle();
    const lr = leadRow as { id: string; first_name: string; last_name: string } | null;
    if (lr?.id) {
      teachers.unshift({ id: lr.id, label: formatProfileSnakeSurnameFirst(lr) });
    }
  }

  const asstRes = await supabase
    .from("academic_section_assistants")
    .select("assistant_id")
    .eq("section_id", sectionId);
  if (asstRes.error) {
    logSupabaseClientError("loadAdminSectionTeachersAndAssistants:assistantsSelect", asstRes.error, {
      sectionId,
    });
  }
  const assistantIds = asstRes.error
    ? []
    : [...new Set((asstRes.data ?? []).map((x) => (x as { assistant_id: string }).assistant_id))];

  let initialAssistants: SectionStaffProfileAssistant[] = [];
  if (assistantIds.length > 0) {
    const { data: ap } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .in("id", assistantIds);
    initialAssistants =
      [...(ap ?? [])]
        .sort((a, b) =>
          compareProfileSnakeByLastThenFirst(
            a as { first_name: string; last_name: string },
            b as { first_name: string; last_name: string },
          ),
        )
        .map((p) => {
          const r = p as { id: string; first_name: string; last_name: string; role: string };
          return {
            id: r.id,
            label: formatProfileSnakeSurnameFirst(r),
            role: r.role,
          };
        }) ?? [];
  }

  const extRes = await supabase
    .from("academic_section_external_assistants")
    .select("id, display_name")
    .eq("section_id", sectionId)
    .order("created_at", { ascending: true });
  if (extRes.error) {
    logSupabaseClientError("loadAdminSectionTeachersAndAssistants:externalSelect", extRes.error, {
      sectionId,
    });
  }
  const initialExternalAssistants: SectionStaffExternalOption[] = extRes.error
    ? []
    : (extRes.data ?? []).map((row) => {
        const r = row as { id: string; display_name: string };
        return { id: r.id, label: r.display_name };
      });

  return { teachers, assistantPortalStaffOptions, initialAssistants, initialExternalAssistants };
}
