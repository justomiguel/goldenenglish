"use server";

import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { collectSectionsChargingEnrollmentFee } from "@/lib/register/markRegistrationRowsEnrollmentFee";
import {
  summarizeRegistrationFunnelBatch,
  type FunnelBatchItem,
  type FunnelBatchSummary,
} from "@/lib/register/registrationFunnelBatch";
import {
  REGISTRATION_FUNNEL_STAGES,
  registrationFunnelStage,
  type RegistrationFunnelRow,
  type RegistrationFunnelStage,
} from "@/lib/register/registrationFunnelStage";
import {
  parseRegistrationIntakeState,
  snapshotTotalFromUnknown,
} from "@/lib/register/registrationIntake";
import { revalidateRegistrationInbox } from "@/lib/register/registrationIntakeActionSupport";
import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";
import { createAdminClient } from "@/lib/supabase/admin";
import { markRegistrationContacted } from "./registrationStatusAction";
import { revertRegistrationFunnelStageAction } from "./revertRegistrationFunnelStageAction";

const idsZ = z.array(z.string().uuid()).max(25);

const COLUMNS =
  "id,status,intake_state,fee_snapshot,fee_captured,enrollment_fee_mail_sent_at,accepted_student_id,preferred_section_id,additional_section_ids";

export type FunnelBatchActionResult = FunnelBatchSummary | { ok: false; code: "forbidden"; updated: number; failed: number };

function sectionIdsOf(row: Record<string, unknown>): string[] {
  const additional = Array.isArray(row.additional_section_ids)
    ? row.additional_section_ids.map(String)
    : [];
  const preferred = row.preferred_section_id == null ? null : String(row.preferred_section_id);
  return requestedRegistrationSectionIds({
    preferred_section_id: preferred,
    additionalSectionIds: additional,
  });
}

function funnelRow(row: Record<string, unknown>, charging: ReadonlySet<string>): RegistrationFunnelRow {
  const sectionIds = sectionIdsOf(row);
  return {
    status: String(row.status ?? ""),
    intakeState: parseRegistrationIntakeState(row.intake_state),
    snapshotTotal: snapshotTotalFromUnknown(row.fee_snapshot),
    chargesEnrollmentFee: sectionIds.some((id) => charging.has(id)),
    feeCaptured: row.fee_captured === true,
    enrollmentFeeMailSentAt:
      row.enrollment_fee_mail_sent_at == null ? null : String(row.enrollment_fee_mail_sent_at),
    acceptedStudentId: row.accepted_student_id == null ? null : String(row.accepted_student_id),
  };
}

async function applyOne(
  locale: string,
  stage: RegistrationFunnelStage,
  id: string,
): Promise<boolean> {
  if (stage === "registered") {
    const result = await markRegistrationContacted(locale, id);
    return result.ok;
  }
  const result = await revertRegistrationFunnelStageAction({ locale, registrationId: id });
  return result.ok;
}

export async function applyRegistrationFunnelBatchAction(input: {
  locale: string;
  stage: RegistrationFunnelStage;
  registrationIds: string[];
}): Promise<FunnelBatchActionResult> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("applyRegistrationFunnelBatch");
    return { ok: false, code: "forbidden", updated: 0, failed: 0 };
  }

  const parsed = idsZ.safeParse(input.registrationIds);
  if (!parsed.success) {
    return { ok: false, code: "save_failed", updated: 0, failed: input.registrationIds.length };
  }
  if (parsed.data.length === 0 || !REGISTRATION_FUNNEL_STAGES.includes(input.stage)) {
    return { ok: false, code: "funnel_batch_empty", updated: 0, failed: 0 };
  }

  const admin = await createAdminClient();
  const { data, error } = await admin.from("registrations").select(COLUMNS).in("id", parsed.data);
  if (error) {
    logSupabaseClientError("applyRegistrationFunnelBatch:select", error, { code: "save_failed" });
    return { ok: false, code: "save_failed", updated: 0, failed: parsed.data.length };
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const byId = new Map(rows.map((row) => [String(row.id), row]));
  const sectionIds = rows.flatMap(sectionIdsOf);
  const charging = await collectSectionsChargingEnrollmentFee(admin, sectionIds);
  const items: FunnelBatchItem[] = [];

  for (const id of parsed.data) {
    const row = byId.get(id);
    const stage = row ? registrationFunnelStage(funnelRow(row, charging)) : null;
    if (!row || stage !== input.stage) {
      items.push({ applied: false, leftStage: true });
      continue;
    }
    items.push({ applied: await applyOne(input.locale, input.stage, id), leftStage: false });
  }

  const summary = summarizeRegistrationFunnelBatch(items);
  if (summary.code !== "funnel_batch_empty") {
    await recordSystemAudit({
      action: "registration_funnel_batch",
      resourceType: "registration",
      resourceId: parsed.data[0],
      payload: { stage: input.stage, updated: summary.updated, failed: summary.failed },
    });
  }
  if (summary.updated > 0) revalidateRegistrationInbox(input.locale);
  return summary;
}
