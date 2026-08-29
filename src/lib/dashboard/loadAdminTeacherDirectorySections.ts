import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { AdminStudentDirectorySection } from "@/lib/dashboard/loadAdminStudentDirectoryExtras";

type LeadRow = {
  id: string;
  name: string | null;
  teacher_id: string;
  cohort_id: string | null;
};

type AssistantRow = {
  assistant_id: string;
  section_id: string;
};

type SectionNameRow = {
  id: string;
  name: string | null;
  cohort_id: string | null;
};

type SectionMeta = { name: string; cohortId: string | null };

function sectionLabel(id: string, name: string | null | undefined): string {
  const n = name?.trim();
  return n && n.length > 0 ? n : id;
}

function addSection(
  byTeacher: Map<string, Map<string, SectionMeta>>,
  teacherId: string,
  sectionId: string,
  meta: SectionMeta,
) {
  const inner = byTeacher.get(teacherId) ?? new Map<string, SectionMeta>();
  if (!inner.has(sectionId)) inner.set(sectionId, meta);
  byTeacher.set(teacherId, inner);
}

function pushId(byTeacher: Map<string, string[]>, teacherId: string, sectionId: string) {
  const list = byTeacher.get(teacherId) ?? [];
  if (!list.includes(sectionId)) list.push(sectionId);
  byTeacher.set(teacherId, list);
}

function toSortedLists(
  byTeacher: Map<string, Map<string, SectionMeta>>,
): Map<string, AdminStudentDirectorySection[]> {
  const out = new Map<string, AdminStudentDirectorySection[]>();
  for (const [teacherId, sections] of byTeacher) {
    const list = [...sections.entries()]
      .map(([id, meta]) => ({
        id,
        name: meta.name,
        cohortId: meta.cohortId,
        discountPercent: null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    out.set(teacherId, list);
  }
  return out;
}

export type AdminTeacherDirectoryLoad = {
  sections: Map<string, AdminStudentDirectorySection[]>;
  leadIds: Map<string, string[]>;
  assistantIds: Map<string, string[]>;
};

export async function loadAdminTeacherDirectorySections(
  admin: SupabaseClient,
  teacherIds: string[],
): Promise<Map<string, AdminStudentDirectorySection[]>> {
  return (await loadAdminTeacherDirectoryWithRoles(admin, teacherIds)).sections;
}

export async function loadAdminTeacherDirectoryWithRoles(
  admin: SupabaseClient,
  teacherIds: string[],
): Promise<AdminTeacherDirectoryLoad> {
  const empty: AdminTeacherDirectoryLoad = {
    sections: new Map(),
    leadIds: new Map(),
    assistantIds: new Map(),
  };
  const ids = teacherIds.filter((id) => id.trim().length > 0);
  if (ids.length === 0) return empty;

  const [leadResult, assistantResult] = await Promise.all([
    admin
      .from("academic_sections")
      .select("id, name, teacher_id, cohort_id")
      .in("teacher_id", ids)
      .is("archived_at", null),
    admin
      .from("academic_section_assistants")
      .select("assistant_id, section_id")
      .in("assistant_id", ids),
  ]);

  if (leadResult.error) {
    logSupabaseClientError("loadAdminTeacherDirectorySections:lead", leadResult.error, {
      teacherCount: ids.length,
    });
  }
  if (assistantResult.error) {
    logSupabaseClientError("loadAdminTeacherDirectorySections:assistants", assistantResult.error, {
      teacherCount: ids.length,
    });
  }

  const byTeacher = new Map<string, Map<string, SectionMeta>>();
  const leadIds = new Map<string, string[]>();
  const assistantIds = new Map<string, string[]>();
  for (const raw of (leadResult.data ?? []) as LeadRow[]) {
    const teacherId = String(raw.teacher_id);
    const sectionId = String(raw.id);
    addSection(byTeacher, teacherId, sectionId, {
      name: sectionLabel(raw.id, raw.name),
      cohortId: raw.cohort_id?.trim() || null,
    });
    pushId(leadIds, teacherId, sectionId);
  }

  const assistants = (assistantResult.data ?? []) as AssistantRow[];
  const assistantSectionIds = [
    ...new Set(assistants.map((row) => String(row.section_id)).filter(Boolean)),
  ];

  const metaBySectionId = new Map<string, SectionMeta>();
  if (assistantSectionIds.length > 0) {
    const { data, error } = await admin
      .from("academic_sections")
      .select("id, name, cohort_id")
      .in("id", assistantSectionIds)
      .is("archived_at", null);
    if (error) {
      logSupabaseClientError("loadAdminTeacherDirectorySections:assistantSections", error, {
        sectionCount: assistantSectionIds.length,
      });
    }
    for (const raw of (data ?? []) as SectionNameRow[]) {
      metaBySectionId.set(String(raw.id), {
        name: sectionLabel(raw.id, raw.name),
        cohortId: raw.cohort_id?.trim() || null,
      });
    }
  }

  for (const raw of assistants) {
    const teacherId = String(raw.assistant_id);
    const sectionId = String(raw.section_id);
    const meta = metaBySectionId.get(sectionId);
    if (!meta) continue;
    addSection(byTeacher, teacherId, sectionId, meta);
    pushId(assistantIds, teacherId, sectionId);
  }

  return { sections: toSortedLists(byTeacher), leadIds, assistantIds };
}
