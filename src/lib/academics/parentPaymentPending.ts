import type { SupabaseClient } from "@supabase/supabase-js";

/** True when the student's linked guardian has at least one pending payment. */
export async function loadParentPaymentPendingForStudent(
  supabase: SupabaseClient,
  studentId: string,
): Promise<boolean> {
  const map = await loadParentPaymentPendingMap(supabase, [studentId]);
  return map.get(studentId) ?? false;
}

/** Batch: student_id → has pending guardian payment. */
export async function loadParentPaymentPendingMap(
  supabase: SupabaseClient,
  studentIds: string[],
): Promise<Map<string, boolean>> {
  const out = new Map<string, boolean>();
  if (studentIds.length === 0) return out;

  for (const id of studentIds) out.set(id, false);

  const { data: links, error: lErr } = await supabase
    .from("tutor_student_rel")
    .select("student_id, tutor_id")
    .in("student_id", studentIds);

  if (lErr || !links?.length) return out;

  const parentIds = [...new Set(links.map((r) => (r as { tutor_id: string }).tutor_id))];
  const { data: pend } = await supabase
    .from("payments")
    .select("parent_id")
    .in("parent_id", parentIds)
    .eq("status", "pending");

  if (pend?.length) {
    const parentsWithDebt = new Set(pend.map((r) => (r as { parent_id: string }).parent_id));
    for (const row of links as { student_id: string; tutor_id: string }[]) {
      if (parentsWithDebt.has(row.tutor_id)) out.set(row.student_id, true);
    }
  }

  const { data: minors } = await supabase
    .from("profiles")
    .select("id")
    .in("id", studentIds)
    .eq("is_minor", true);

  const minorIds = (minors ?? [])
    .map((r) => (r as { id: string }).id)
    .filter(Boolean);
  if (!minorIds.length) return out;

  const { data: openInvoices } = await supabase
    .from("billing_invoices")
    .select("student_id")
    .in("student_id", minorIds)
    .in("status", ["pending", "verifying", "overdue"]);

  for (const row of openInvoices ?? []) {
    const sid = (row as { student_id: string }).student_id;
    if (sid) out.set(sid, true);
  }

  return out;
}
