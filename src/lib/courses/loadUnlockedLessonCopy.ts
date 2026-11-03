import type { SupabaseClient } from "@supabase/supabase-js";
import { lessonPlainText } from "@/lib/courses/continueCourse";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const SCOPE = "courses.lessonCopy";

export async function loadUnlockedLessonCopy(
  admin: SupabaseClient,
  templateId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("content_templates")
    .select("description, body_html")
    .eq("id", templateId)
    .maybeSingle();
  logSupabaseClientError(SCOPE, error, { templateId });
  if (error || !data) return null;
  const row = data as { description: string | null; body_html: string | null };
  const text = lessonPlainText(`${row.description ?? ""} ${row.body_html ?? ""}`);
  return text.length > 0 ? text : null;
}
