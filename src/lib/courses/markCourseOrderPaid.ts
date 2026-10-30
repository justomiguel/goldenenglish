import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function markCourseOrderPaid(
  admin: SupabaseClient,
  orderId: string,
): Promise<{ ok: true } | { ok: false }> {
  const { data, error } = await admin
    .from("course_orders")
    .select("id, student_id, course_id, status")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) {
    logSupabaseClientError("markCourseOrderPaid:load", error, { orderId });
    return { ok: false };
  }
  if (data.status === "paid") return { ok: true };

  const { error: grantError } = await admin.from("student_course_grants").upsert(
    {
      student_id: data.student_id,
      course_id: data.course_id,
      source: "purchase",
    },
    { onConflict: "student_id,course_id" },
  );
  if (grantError) {
    logSupabaseClientError("markCourseOrderPaid:grant", grantError, { orderId });
    return { ok: false };
  }

  const { error: updateError } = await admin
    .from("course_orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .eq("status", "pending");
  if (updateError) {
    logSupabaseClientError("markCourseOrderPaid:status", updateError, { orderId });
    return { ok: false };
  }
  return { ok: true };
}
