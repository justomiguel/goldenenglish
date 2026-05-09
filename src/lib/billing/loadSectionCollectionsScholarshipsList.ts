import type { SupabaseClient } from "@supabase/supabase-js";
import { mapScholarship, type ScholarshipBenefitRow } from "@/lib/dashboard/loadAdminStudentBillingTabDataMappers";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type { SectionCollectionsScholarshipListRow } from "@/types/sectionCollectionsTabs";

const SCHOLARSHIP_LIST_CAP = 300;

export async function loadSectionCollectionsScholarshipsList(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<SectionCollectionsScholarshipListRow[]> {
  const { data: rows, error } = await supabase
    .from("section_enrollment_scholarships")
    .select(
      "id, enrollment_id, student_id, discount_percent, note, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
    )
    .eq("section_id", sectionId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(SCHOLARSHIP_LIST_CAP);

  if (error) throw error;

  const list = (rows ?? []) as Array<ScholarshipBenefitRow & { student_id: string }>;
  const studentIds = [...new Set(list.map((r) => r.student_id))];
  const nameById = new Map<string, string>();

  if (studentIds.length > 0) {
    const { data: profs, error: profErr } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", studentIds);
    if (profErr) throw profErr;
    for (const r of profs ?? []) {
      const id = r.id as string;
      nameById.set(
        id,
        formatProfileNameSurnameFirst(
          (r.first_name as string | null) ?? "",
          (r.last_name as string | null) ?? "",
        ),
      );
    }
  }

  return list.map((row) => {
    const sid = row.student_id;
    return {
      id: row.id,
      studentId: sid,
      studentDisplayName: nameById.get(sid) ?? sid,
      scholarship: mapScholarship(row),
    };
  });
}
