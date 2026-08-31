import type { SupabaseClient } from "@supabase/supabase-js";
import { parseTrialFeeCreditSnapshot } from "@/lib/billing/parseTrialFeeCreditSnapshot";

export type StudentPaidTrialCredit = {
  registrationId: string;
  trialPaid: number;
  alreadyCredited: number;
};

type TrialCreditRow = {
  id: string;
  trial_fee_snapshot: unknown;
};

function firstPaid(rows: TrialCreditRow[] | null): StudentPaidTrialCredit | null {
  for (const row of rows ?? []) {
    const parsed = parseTrialFeeCreditSnapshot(row.trial_fee_snapshot, true);
    if (parsed.trialPaid <= 0) continue;
    return {
      registrationId: String(row.id),
      trialPaid: parsed.trialPaid,
      alreadyCredited: parsed.alreadyCredited,
    };
  }
  return null;
}

async function loadBy(
  supabase: SupabaseClient,
  column: "accepted_student_id" | "dni",
  value: string,
): Promise<StudentPaidTrialCredit | null> {
  const { data } = await supabase
    .from("registrations")
    .select("id, trial_fee_snapshot")
    .eq("intent", "trial")
    .eq("trial_fee_captured", true)
    .eq(column, value)
    .order("created_at", { ascending: false })
    .limit(8);
  return firstPaid((data ?? []) as TrialCreditRow[]);
}

export async function loadStudentPaidTrialCredit(
  supabase: SupabaseClient,
  input: { studentId: string; dni?: string | null },
): Promise<StudentPaidTrialCredit | null> {
  const studentId = input.studentId.trim();
  const dni = (input.dni ?? "").trim();
  if (studentId) {
    const byStudent = await loadBy(supabase, "accepted_student_id", studentId);
    if (byStudent) return byStudent;
  }
  if (dni) return loadBy(supabase, "dni", dni);
  return null;
}
