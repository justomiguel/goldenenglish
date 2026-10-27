import type { SupabaseClient } from "@supabase/supabase-js";
import { auditAcademicAction, auditIdentityAction } from "@/lib/audit";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export async function loadStudentTutorSummaryList(
  admin: SupabaseClient,
  studentId: string,
): Promise<string[]> {
  try {
    const { data: rels } = await admin
      .from("tutor_student_rel")
      .select("tutor_id, relationship")
      .eq("student_id", studentId);
    if (!Array.isArray(rels) || rels.length === 0) return [];
    const summaries: string[] = [];
    for (const rel of rels as Array<{ tutor_id?: unknown; relationship?: unknown }>) {
      const tutorId = String(rel.tutor_id ?? "");
      if (!tutorId) continue;
      let label = tutorId;
      try {
        const { data: prof } = await admin
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", tutorId)
          .single();
        if (prof && (prof.first_name || prof.last_name)) {
          label = formatProfileNameSurnameFirst(prof.first_name, prof.last_name, tutorId);
        }
      } catch {
        /* ignore fallback on partial mocks */
      }
      const relStr = String(rel.relationship ?? "").trim();
      summaries.push(relStr ? `${label} (${relStr})` : label);
    }
    return summaries;
  } catch {
    return [];
  }
}

export function recordStudentTutorAuditChange(input: {
  actorId?: string | null;
  studentId: string;
  action: "link_tutor" | "unlink_tutor";
  summary: string;
  beforeTutors: string[];
  afterTutors: string[];
}) {
  return auditIdentityAction({
    actorId: input.actorId ?? null,
    actorRole: "admin",
    action: input.action,
    resourceType: "student_tutor",
    resourceId: input.studentId,
    summary: input.summary,
    beforeValues: {
      tutor: input.beforeTutors.length > 0 ? input.beforeTutors.join("; ") : "—",
    },
    afterValues: {
      tutor: input.afterTutors.length > 0 ? input.afterTutors.join("; ") : "—",
    },
  });
}

export function recordStudentProfileFieldAudit(input: {
  actorId?: string | null;
  userId: string;
  field: string;
  beforeValue: string | null | undefined;
  afterValue: string | null | undefined;
}) {
  return auditIdentityAction({
    actorId: input.actorId ?? null,
    actorRole: "admin",
    action: "update_profile_field",
    resourceType: "student_profile",
    resourceId: input.userId,
    summary: `Campo actualizado: ${input.field}`,
    beforeValues: { [input.field]: input.beforeValue ?? "—" },
    afterValues: { [input.field]: input.afterValue ?? "—" },
  });
}

export function recordStudentEnrollmentAudit(input: {
  actorId?: string | null;
  studentId: string;
  action: "add_section" | "remove_section" | "move_section";
  summary: string;
  beforeSection: string;
  afterSection: string;
  cohortName?: string | null;
}) {
  return auditAcademicAction({
    actorId: input.actorId ?? null,
    actorRole: "admin",
    action: input.action,
    resourceType: "student_enrollment",
    resourceId: input.studentId,
    summary: input.summary,
    beforeValues: { section: input.beforeSection || "—" },
    afterValues: { section: input.afterSection || "—" },
    metadata: input.cohortName ? { cohort: input.cohortName } : {},
  });
}
