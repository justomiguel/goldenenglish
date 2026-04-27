"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { revalidateStudentBillingPaths } from "./revalidateStudentBilling";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { SupabaseClient } from "@supabase/supabase-js";
import { auditFinanceAction } from "@/lib/audit";

const ym = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

type PaymentStatus = "pending" | "approved" | "rejected" | "exempt";

interface PeriodPaymentRow {
  id: string;
  status: PaymentStatus;
  amount: number | string | null;
  section_id: string | null;
}

async function loadActiveSectionIds(
  supabase: SupabaseClient,
  studentId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("section_enrollments")
    .select("section_id")
    .eq("student_id", studentId)
    .eq("status", "active");
  return [...new Set(((data ?? []) as Array<{ section_id: string }>).map((r) => r.section_id))];
}

async function loadPeriodPayments(
  supabase: SupabaseClient,
  studentId: string,
  year: number,
  month: number,
): Promise<PeriodPaymentRow[]> {
  const { data } = await supabase
    .from("payments")
    .select("id, status, amount, section_id")
    .eq("student_id", studentId)
    .eq("year", year)
    .eq("month", month);
  return (data ?? []) as PeriodPaymentRow[];
}

function amountIsZero(value: number | string | null): boolean {
  return value == null || Number(value) === 0;
}

function auditPaymentRows(rows: PeriodPaymentRow[]) {
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    amount: row.amount,
    section_id: row.section_id,
  }));
}

async function updatePaymentExempt(
  supabase: SupabaseClient,
  paymentId: string,
  sectionId: string | null,
  adminNote: string | undefined,
) {
  return supabase
    .from("payments")
    .update({
      section_id: sectionId,
      status: "exempt",
      admin_notes: adminNote?.trim() || null,
      receipt_url: null,
    })
    .eq("id", paymentId);
}

export async function setPeriodExemption(raw: {
  locale: string;
  studentId: string;
  sectionId?: string;
  year: number;
  month: number;
  exempt: boolean;
  adminNote?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(raw.locale);
  const b = dict.actionErrors.billingStudent;

  const sid = z.string().uuid().safeParse(raw.studentId);
  if (!sid.success) return { ok: false, message: b.invalidStudent };
  const sectionId = raw.sectionId ? z.string().uuid().safeParse(raw.sectionId) : null;
  if (sectionId && !sectionId.success) return { ok: false, message: b.invalidData };
  const p = ym.safeParse({ year: raw.year, month: raw.month });
  if (!p.success) return { ok: false, message: b.invalidPeriod };

  try {
    const { supabase, user } = await assertAdmin();

    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", sid.data)
      .single();
    if (prof?.role !== "student") return { ok: false, message: b.notAStudent };

    const [activeSectionIds, periodPayments] = await Promise.all([
      loadActiveSectionIds(supabase, sid.data),
      loadPeriodPayments(supabase, sid.data, p.data.year, p.data.month),
    ]);
    const sectionIds = sectionId?.data ? [sectionId.data] : activeSectionIds;
    if (sectionId?.data && !activeSectionIds.includes(sectionId.data)) {
      return { ok: false, message: b.invalidData };
    }
    const legacyPayment = periodPayments.find((row) => row.section_id == null) ?? null;
    const sectionPaymentById = new Map(
      periodPayments
        .filter((row) => row.section_id != null)
        .map((row) => [row.section_id as string, row]),
    );

    if (raw.exempt) {
      const targets = sectionIds.length > 0 ? sectionIds : [null];
      let reusableLegacy =
        legacyPayment && legacyPayment.status !== "approved" ? legacyPayment : null;

      for (const sectionId of targets) {
        const existing = sectionId ? sectionPaymentById.get(sectionId) : legacyPayment;
        if (existing?.status === "approved" || (!existing && legacyPayment?.status === "approved")) {
          return { ok: false, message: b.cannotExemptApproved };
        }
      }

      for (const sectionId of targets) {
        const existing = sectionId ? sectionPaymentById.get(sectionId) : legacyPayment;
        const rowToUpdate = existing ?? reusableLegacy;
        if (rowToUpdate) {
          const { error } = await updatePaymentExempt(
            supabase,
            rowToUpdate.id,
            sectionId,
            raw.adminNote,
          );
          reusableLegacy = null;
          if (error) {
            logSupabaseClientError("setPeriodExemption:paymentsUpdateExempt", error, {
              studentId: sid.data,
              paymentId: rowToUpdate.id,
              sectionId,
            });
            return { ok: false, message: b.saveFailed };
          }
        } else {
          const { error } = await supabase.from("payments").insert({
            student_id: sid.data,
            section_id: sectionId,
            year: p.data.year,
            month: p.data.month,
            amount: 0,
            status: "exempt",
            admin_notes: raw.adminNote?.trim() || null,
          });
          if (error) {
            logSupabaseClientError("setPeriodExemption:paymentsInsertExempt", error, {
              studentId: sid.data,
              sectionId,
              period: `${p.data.year}-${p.data.month}`,
            });
            return { ok: false, message: b.saveFailed };
          }
        }
      }
    } else {
      const rowsToClear = periodPayments.filter((row) => row.status === "exempt");
      if (rowsToClear.length === 0) {
        return { ok: false, message: b.periodNotExempt };
      }

      for (const existing of rowsToClear) {
        if (amountIsZero(existing.amount)) {
          const { error } = await supabase.from("payments").delete().eq("id", existing.id);
          if (error) {
            logSupabaseClientError("setPeriodExemption:paymentsDelete", error, {
              studentId: sid.data,
              paymentId: existing.id,
            });
            return { ok: false, message: b.saveFailed };
          }
          continue;
        }

        const { error } = await supabase
          .from("payments")
          .update({
            status: "pending",
            admin_notes: raw.adminNote?.trim() ?? null,
          })
          .eq("id", existing.id);
        if (error) {
          logSupabaseClientError("setPeriodExemption:paymentsUpdatePending", error, {
            studentId: sid.data,
            paymentId: existing.id,
          });
          return { ok: false, message: b.saveFailed };
        }
      }
    }

    const afterPayments = await loadPeriodPayments(supabase, sid.data, p.data.year, p.data.month);
    void auditFinanceAction({
      actorId: user.id,
      actorRole: "admin",
      action: raw.exempt ? "create" : "delete",
      resourceType: "period_exemption",
      resourceId: sid.data,
      summary: raw.exempt
        ? "Admin applied student billing exemption"
        : "Admin removed student billing exemption",
      beforeValues: {
        student_id: sid.data,
        year: p.data.year,
        month: p.data.month,
        payments: auditPaymentRows(periodPayments),
      },
      afterValues: {
        student_id: sid.data,
        year: p.data.year,
        month: p.data.month,
        payments: auditPaymentRows(afterPayments),
      },
      metadata: {
        section_ids: sectionIds,
        note_present: Boolean(raw.adminNote?.trim()),
      },
    });
    revalidateStudentBillingPaths(raw.locale, sid.data);
    return { ok: true };
  } catch (err) {
    logServerException("setPeriodExemption", err);
    return { ok: false, message: b.forbidden };
  }
}
