import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyPortalRecipientForStaffMessage } from "@/lib/messaging/notifyMessagingEmails";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  MESSAGING_UC_NO_ADMINS,
  MESSAGING_UC_PERSIST_FAILED,
} from "@/lib/messaging/messagingUseCaseCodes";

export async function sendStudentMessageToAdministrationUseCase(input: {
  supabase: SupabaseClient;
  studentId: string;
  studentDisplayName: string;
  bodyHtml: string;
  locale: string;
  emailProvider: EmailProvider;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = createAdminClient();
  const { data: admins, error: adminErr } = await admin
    .from("profiles")
    .select("id, role")
    .eq("role", "admin")
    .limit(500);

  if (adminErr) {
    logSupabaseClientError("sendStudentMessageToAdministration:listAdmins", adminErr, {});
    return { ok: false, message: MESSAGING_UC_PERSIST_FAILED };
  }

  const adminRows = (admins ?? []).filter((r) => r.id && r.role === "admin");
  if (adminRows.length === 0) {
    return { ok: false, message: MESSAGING_UC_NO_ADMINS };
  }

  const batchId = randomUUID();
  const rows = adminRows.map((a) => ({
    sender_id: input.studentId,
    recipient_id: a.id as string,
    body_html: input.bodyHtml,
    broadcast_batch_id: batchId,
  }));

  const { error } = await input.supabase.from("portal_messages").insert(rows);
  if (error) {
    logSupabaseClientError("sendStudentMessageToAdministration:insert", error, {
      studentId: input.studentId,
      batchId,
      recipientCount: rows.length,
    });
    return { ok: false, message: MESSAGING_UC_PERSIST_FAILED };
  }

  const preview = stripHtmlToText(input.bodyHtml).slice(0, 500);
  await Promise.all(
    adminRows.map(async (a) => {
      try {
        await notifyPortalRecipientForStaffMessage({
          recipientId: a.id as string,
          senderName: input.studentDisplayName,
          messagePreview: preview || "(empty)",
          locale: input.locale,
          emailProvider: input.emailProvider,
          recipientRole: "admin",
        });
      } catch (emailErr) {
        logServerException("sendStudentMessageToAdministration:notifyAdmin", emailErr, {
          studentId: input.studentId,
          adminId: a.id as string,
        });
      }
    }),
  );

  return { ok: true };
}
