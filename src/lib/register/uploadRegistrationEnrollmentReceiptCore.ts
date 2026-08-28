import type { SupabaseClient } from "@supabase/supabase-js";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import { sendRegistrationAdminEmails } from "@/lib/email/registrationIntakeEmails";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { validateEventTransferReceiptFile } from "@/lib/events/eventTransferReceiptLimits";
import { logSupabaseClientError, logServerWarn } from "@/lib/logging/serverActionLog";
import { buildRegistrationEnrollmentReceiptPath } from "@/lib/register/buildRegistrationEnrollmentReceiptPath";
import {
  familyEmailFromPayLead,
  loadRegistrationPayLeadByToken,
  requestedSectionIdsFromLead,
} from "@/lib/register/loadRegistrationPayLeadByToken";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";
import { absoluteUrl } from "@/lib/site/publicUrl";
import type { Locale } from "@/types/i18n";

const RECEIPTS_BUCKET = "payment-receipts";

export type UploadRegistrationEnrollmentReceiptResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "invalid_file"
        | "not_found"
        | "enrolled"
        | "section_full"
        | "already_captured"
        | "no_amount"
        | "storage_failed"
        | "update_failed";
    };

export async function uploadRegistrationEnrollmentReceiptCore(input: {
  admin: SupabaseClient;
  payToken: string;
  fileName: string;
  fileBytes: Buffer;
  fileMime: string;
  locale: string;
  sectionLabel: string;
}): Promise<UploadRegistrationEnrollmentReceiptResult> {
  const validated = validateEventTransferReceiptFile({
    size: input.fileBytes.byteLength,
    type: input.fileMime,
  });
  if (!validated.ok) {
    logServerWarn("registration.uploadEnrollmentReceipt", {
      reason: "invalid_file",
      code: validated.code,
    });
    return { ok: false, code: "invalid_file" };
  }

  const lead = await loadRegistrationPayLeadByToken(input.admin, input.payToken);
  if (!lead) return { ok: false, code: "not_found" };
  if (lead.status === "enrolled") return { ok: false, code: "enrolled" };
  if (lead.feeCaptured) return { ok: false, code: "already_captured" };
  if (!(lead.snapshotTotal > 0)) return { ok: false, code: "no_amount" };

  const open = await requestedSectionsHaveOpenSeats(
    input.admin,
    requestedSectionIdsFromLead(lead),
  );
  if (!open) return { ok: false, code: "section_full" };

  const path = buildRegistrationEnrollmentReceiptPath({
    registrationId: lead.id,
    filename: input.fileName,
    mime: validated.mime,
  });

  const { error: uploadError } = await input.admin.storage
    .from(RECEIPTS_BUCKET)
    .upload(path, input.fileBytes, { contentType: validated.mime, upsert: false });
  if (uploadError) {
    logSupabaseClientError("uploadRegistrationEnrollmentReceipt:storage", uploadError, {
      registrationId: lead.id,
    });
    return { ok: false, code: "storage_failed" };
  }

  const { error: updateError } = await input.admin
    .from("registrations")
    .update({
      intake_state: "receipt_pending",
      enrollment_fee_receipt_path: path,
    })
    .eq("id", lead.id);
  if (updateError) {
    logSupabaseClientError("uploadRegistrationEnrollmentReceipt:update", updateError, {
      registrationId: lead.id,
    });
    await input.admin.storage.from(RECEIPTS_BUCKET).remove([path]);
    return { ok: false, code: "update_failed" };
  }

  await notifyReceiptUploaded({
    lead,
    locale: input.locale as Locale,
    sectionLabel: input.sectionLabel,
  });
  return { ok: true };
}

async function notifyReceiptUploaded(input: {
  lead: NonNullable<Awaited<ReturnType<typeof loadRegistrationPayLeadByToken>>>;
  locale: Locale;
  sectionLabel: string;
}): Promise<void> {
  const studentName = `${input.lead.firstName} ${input.lead.lastName}`.trim();
  const amountLabel = formatMoneyLabel(
    input.lead.snapshotTotal,
    input.lead.snapshotCurrency,
    input.locale,
  );
  const familyEmail = familyEmailFromPayLead(input.lead);
  if (familyEmail) {
    await sendBrandedEmail({
      to: familyEmail,
      templateKey: "billing.receipt_submitted_pending",
      locale: input.locale,
      vars: {
        periodLabel: "Matrícula",
        amountLabel,
        sectionName: input.sectionLabel || "—",
      },
    });
  }
  await sendRegistrationAdminEmails({
    locale: input.locale,
    templateKey: "registration.admin_receipt_pending",
    vars: {
      studentName,
      studentDni: "—",
      studentBirth: "—",
      tutorBlock: input.lead.tutorName
        ? `<p style="margin:0 0 8px;">Tutor: ${input.lead.tutorName}</p>`
        : "",
      sectionName: input.sectionLabel || "—",
      scheduleLabel: input.sectionLabel || "—",
      amountLabel,
      feeModeLabel: "—",
      sourceLabel: "/matricula",
      existingStudentLabel: "—",
      adminUrl:
        absoluteUrl(`/${input.locale}/dashboard/admin/registrations`)?.toString() ?? "",
    },
  });
}
