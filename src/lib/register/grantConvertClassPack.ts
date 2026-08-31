import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function grantConvertClassPack(input: {
  admin: SupabaseClient;
  studentId: string;
  classPack: {
    amount?: unknown;
    currency?: unknown;
    classCount?: unknown;
    priceId?: unknown;
  };
  year: number;
  month: number;
}): Promise<{ ok: boolean }> {
  const classCount = Number(input.classPack.classCount ?? 0);
  const amount = Number(input.classPack.amount ?? 0);
  const currency = String(input.classPack.currency ?? "").trim().toUpperCase();
  const priceId = String(input.classPack.priceId ?? "").trim();
  if (!(classCount > 0) || !(amount >= 0) || currency.length !== 3) return { ok: true };

  const { data: existing } = await input.admin
    .from("student_class_packs")
    .select("id")
    .eq("student_id", input.studentId)
    .eq("year", input.year)
    .eq("month", input.month)
    .in("status", ["approved", "exempt", "pending"])
    .limit(1);
  if ((existing ?? []).length > 0) return { ok: true };

  const { error } = await input.admin.from("student_class_packs").insert({
    student_id: input.studentId,
    year: input.year,
    month: input.month,
    class_count: classCount,
    amount,
    currency,
    price_id: priceId || null,
    status: "approved",
    paid_at: new Date().toISOString(),
  });
  if (error) {
    logSupabaseClientError("grantConvertClassPack:insert", error, {
      studentId: input.studentId,
    });
    return { ok: false };
  }
  return { ok: true };
}
