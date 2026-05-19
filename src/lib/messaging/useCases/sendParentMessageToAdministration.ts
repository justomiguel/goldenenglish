import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyPortalRecipientForStaffMessage } from "@/lib/messaging/notifyMessagingEmails";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  MESSAGING_UC_INVALID_RECIPIENT,
  MESSAGING_UC_NO_ADMINS,
  MESSAGING_UC_PERSIST_FAILED,
} from "@/lib/messaging/messagingUseCaseCodes";

async function parentHasLinkedStudent(
  supabase: SupabaseClient,
  parentId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", parentId)
    .limit(1);
  if (error) {
    logSupabaseClientError("parentHasLinkedStudent:tutor_student_rel", error, { parentId });
    return false;
  }
  return (data?.length ?? 0) > 0;
}

export async function sendParentMessageToAdministrationUseCase(input: {
  supabase: SupabaseClient;
  parentId: string;
  parentDisplayName: string;
  bodyHtml: string;
  locale: string;
  emailProvider: EmailProvider;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const linked = await parentHasLinkedStudent(input.supabase, input.parentId);
  if (!linked) {
    return { ok: false, message: MESSAGING_UC_INVALID_RECIPIENT };
  }

  const admin = createAdminClient();
  const { data: admins, error: adminErr } = await admin
    .from("profiles")
    .select("id, role")
    .eq("role", "admin")
    .limit(500);

  if (adminErr) {
    logSupabaseClientError("sendParentMessageToAdministration:listAdmins", adminErr, {});
    return { ok: false, message: MESSAGING_UC_PERSIST_FAILED };
  }

  const adminRows = (admins ?? []).filter((r) => r.id && r.role === "admin");
  if (adminRows.length === 0) {
    return { ok: false, message: MESSAGING_UC_NO_ADMINS };
  }

  const batchId = randomUUID();
  const rows = adminRows.map((a) => ({
    sender_id: input.parentId,
    recipient_id: a.id as string,
    body_html: input.bodyHtml,
    broadcast_batch_id: batchId,
  }));

  const { error } = await input.supabase.from("portal_messages").insert(rows);
  if (error) {
    logSupabaseClientError("sendParentMessageToAdministration:insert", error, {
      parentId: input.parentId,
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
          senderName: input.parentDisplayName,
          messagePreview: preview || "(empty)",
          locale: input.locale,
          emailProvider: input.emailProvider,
          recipientRole: "admin",
        });
      } catch (emailErr) {
        logServerException("sendParentMessageToAdministration:notifyAdmin", emailErr, {
          parentId: input.parentId,
          adminId: a.id as string,
        });
      }
    }),
  );

  return { ok: true };
}
