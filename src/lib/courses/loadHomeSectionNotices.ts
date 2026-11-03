import type { SupabaseClient } from "@supabase/supabase-js";
import { selectSectionNotices, type SectionNoticeRow } from "@/lib/courses/sectionNotices";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function loadHomeSectionNotices(
  supabase: SupabaseClient,
  studentId: string,
): Promise<SectionNoticeRow[]> {
  const { data: enrollments, error } = await supabase
    .from("section_enrollments")
    .select("section_id")
    .eq("student_id", studentId)
    .eq("status", "active")
    .limit(40);
  if (error) {
    logSupabaseClientError("loadHomeSectionNotices:enrollments", error, { studentId });
    return [];
  }
  const sectionIds = [...new Set(((enrollments ?? []) as { section_id: string }[]).map((row) => row.section_id))];
  if (sectionIds.length === 0) return [];

  const { data, error: noticeError } = await supabase
    .from("section_notices")
    .select("id, section_id, body_text, published_at, archived_at")
    .in("section_id", sectionIds)
    .is("archived_at", null)
    .order("published_at", { ascending: false })
    .limit(40);
  if (noticeError) {
    logSupabaseClientError("loadHomeSectionNotices:notices", noticeError, { studentId });
    return [];
  }
  const notices = ((data ?? []) as {
    id: string;
    section_id: string;
    body_text: string;
    published_at: string;
    archived_at: string | null;
  }[]).map((row) => ({
    id: row.id,
    sectionId: row.section_id,
    body: row.body_text,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
  }));
  return selectSectionNotices(notices, sectionIds);
}
