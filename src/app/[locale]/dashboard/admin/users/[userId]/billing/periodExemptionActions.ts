"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { revalidateStudentBillingPaths } from "./revalidateStudentBilling";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

const ym = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export async function setPeriodExemption(raw: {
  locale: string;
  studentId: string;
  year: number;
  month: number;
  exempt: boolean;
  adminNote?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(raw.locale);
  const b = dict.actionErrors.billingStudent;

  const sid = z.string().uuid().safeParse(raw.studentId);
  if (!sid.success) return { ok: false, message: b.invalidStudent };
  const p = ym.safeParse({ year: raw.year, month: raw.month });
  if (!p.success) return { ok: false, message: b.invalidPeriod };

  try {
    const { supabase } = await assertAdmin();

    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", sid.data)
      .single();
    if (prof?.role !== "student") return { ok: false, message: b.notAStudent };

    const { data: existing } = await supabase
      .from("payments")
      .select("id, status, amount")
      .eq("student_id", sid.data)
      .eq("year", p.data.year)
      .eq("month", p.data.month)
      .maybeSingle();

    if (raw.exempt) {
      if (existing?.id) {
        if (existing.status === "approved") {
          return { ok: false, message: b.cannotExemptApproved };
        }
        const { error } = await supabase
          .from("payments")
          .update({
            status: "exempt",
            admin_notes: raw.adminNote?.trim() || null,
            receipt_url: null,
          })
          .eq("id", existing.id as string);
        if (error) {
          logSupabaseClientError("setPeriodExemption:paymentsUpdateExempt", error, {
            studentId: sid.data,
            paymentId: existing.id as string,
          });
          return { ok: false, message: b.saveFailed };
        }
      } else {
        const { error } = await supabase.from("payments").insert({
          student_id: sid.data,
          year: p.data.year,
          month: p.data.month,
          amount: 0,
          status: "exempt",
          admin_notes: raw.adminNote?.trim() || null,
        });
        if (error) {
          logSupabaseClientError("setPeriodExemption:paymentsInsertExempt", error, {
            studentId: sid.data,
            period: `${p.data.year}-${p.data.month}`,
          });
          return { ok: false, message: b.saveFailed };
        }
      }
    } else if (existing?.id) {
      if (existing.status !== "exempt") {
        return { ok: false, message: b.periodNotExempt };
      }
      const amt = existing.amount != null ? Number(existing.amount) : 0;
      if (amt === 0) {
        const { error } = await supabase.from("payments").delete().eq("id", existing.id as string);
        if (error) {
          logSupabaseClientError("setPeriodExemption:paymentsDelete", error, {
            studentId: sid.data,
            paymentId: existing.id as string,
          });
          return { ok: false, message: b.saveFailed };
        }
      } else {
        const { error } = await supabase
          .from("payments")
          .update({
            status: "pending",
            admin_notes: raw.adminNote?.trim() ?? null,
          })
          .eq("id", existing.id as string);
        if (error) {
          logSupabaseClientError("setPeriodExemption:paymentsUpdatePending", error, {
            studentId: sid.data,
            paymentId: existing.id as string,
          });
          return { ok: false, message: b.saveFailed };
        }
      }
    }

    revalidateStudentBillingPaths(raw.locale, sid.data);
    return { ok: true };
  } catch (err) {
    logServerException("setPeriodExemption", err);
    return { ok: false, message: b.forbidden };
  }
}

export async function applyExemptionRange(raw: {
  locale: string;
  studentId: string;
  fromYear: number;
  fromMonth: number;
  toYear: number;
  toMonth: number;
  adminNote?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(raw.locale);
  const b = dict.actionErrors.billingStudent;

  const sid = z.string().uuid().safeParse(raw.studentId);
  if (!sid.success) return { ok: false, message: b.invalidStudent };

  const from = ym.safeParse({ year: raw.fromYear, month: raw.fromMonth });
  const to = ym.safeParse({ year: raw.toYear, month: raw.toMonth });
  if (!from.success || !to.success) return { ok: false, message: b.invalidRange };

  let y = from.data.year;
  let m = from.data.month;
  const endIdx = to.data.year * 12 + to.data.month;
  let curIdx = y * 12 + m;
  if (endIdx < curIdx) return { ok: false, message: b.invalidRangeOrder };

  while (curIdx <= endIdx) {
    const r = await setPeriodExemption({
      locale: raw.locale,
      studentId: sid.data,
      year: y,
      month: m,
      exempt: true,
      adminNote: raw.adminNote,
    });
    if (!r.ok) return r;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    curIdx = y * 12 + m;
  }

  return { ok: true };
}
