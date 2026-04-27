import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { personProfileMatchPrefix } from "@/lib/users/profileSearchPrefix";

const uuid = z.string().uuid();

export type TeacherStudentSearchHit = { id: string; label: string };

const SCOPE = "searchTeacherStudentsInOwnSections" as const;

/**
 * Students with an active enrollment in any of the given sections, filtered by
 * name or document, only when every section belongs to `teacherProfileId`.
 */
export async function searchTeacherStudentsInOwnSections(
  supabase: SupabaseClient,
  teacherProfileId: string,
  query: string,
  sectionIds: string[],
): Promise<TeacherStudentSearchHit[]> {
  const q = query.trim();
  if (q.length > 0 && q.length < 2) return [];

  const idsParse = z.array(uuid).max(120).safeParse(sectionIds);
  if (!idsParse.success || idsParse.data.length === 0) return [];

  const { data: leadRows, error: leadErr } = await supabase
    .from("academic_sections")
    .select("id")
    .in("id", idsParse.data)
    .eq("teacher_id", teacherProfileId);
  if (leadErr) {
    logSupabaseClientError(`${SCOPE}:sectionsLead`, leadErr, { n: idsParse.data.length });
    return [];
  }
  const { data: asstRows, error: asstErr } = await supabase
    .from("academic_section_assistants")
    .select("section_id")
    .in("section_id", idsParse.data)
    .eq("assistant_id", teacherProfileId);
  if (asstErr) {
    logSupabaseClientError(`${SCOPE}:sectionsAssistants`, asstErr, { n: idsParse.data.length });
  }
  const verified = new Set<string>();
  for (const r of leadRows ?? []) verified.add((r as { id: string }).id);
  if (!asstErr) {
    for (const r of asstRows ?? []) verified.add((r as { section_id: string }).section_id);
  }
  const verifiedSectionIds = idsParse.data.filter((id) => verified.has(id));
  if (verifiedSectionIds.length === 0) return [];

  const { data: enrRows, error: enErr } = await supabase
    .from("section_enrollments")
    .select("student_id")
    .in("section_id", verifiedSectionIds)
    .eq("status", "active");
  if (enErr) {
    logSupabaseClientError(`${SCOPE}:enrollments`, enErr, { sections: verifiedSectionIds.length });
    return [];
  }
  if (!enrRows?.length) return [];

  const studentIds = [...new Set(enrRows.map((e) => (e as { student_id: string }).student_id))];
  if (studentIds.length === 0) return [];

  const profiles = await chunkedIn<{
    id: string;
    first_name: string;
    last_name: string;
    dni_or_passport: string | null;
  }>(supabase, "profiles", "id", studentIds, "id, first_name, last_name, dni_or_passport", 200);

  const pool = q.length === 0 ? profiles : profiles.filter((p) => personProfileMatchPrefix(p, q));
  pool.sort((a, b) => {
    const ln = a.last_name.localeCompare(b.last_name, undefined, { sensitivity: "base" });
    if (ln !== 0) return ln;
    return a.first_name.localeCompare(b.first_name, undefined, { sensitivity: "base" });
  });

  const out: TeacherStudentSearchHit[] = [];
  for (const p of pool) {
    out.push({
      id: p.id,
      label: `${p.first_name} ${p.last_name}`.trim(),
    });
    if (out.length >= 24) break;
  }
  return out;
}
