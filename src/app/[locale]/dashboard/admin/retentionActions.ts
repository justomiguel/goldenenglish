"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { loadAdminRetentionCandidates } from "@/lib/academics/loadAdminRetentionCandidates";
import { incrementRetentionContactCount } from "@/lib/academics/incrementRetentionContactCount";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { notifyRetentionOutreachInApp } from "@/lib/messaging/notifyRetentionOutreachInApp";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { logServerException, logServerActionInvariantViolation } from "@/lib/logging/serverActionLog";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

const payloadSchema = z.object({
  locale: z.enum(["en", "es"]),
  cohortId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
});

export type RecordRetentionWhatsappState =
  | { ok: true }
  | { ok: false; code: "auth" | "parse" | "save" };

export async function recordRetentionWhatsappContactAction(
  input: unknown,
): Promise<RecordRetentionWhatsappState> {
  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "parse" };
  }
  const { locale, cohortId, enrollmentId } = parsed.data;

  try {
    const { supabase, user } = await assertAdmin();
    const inc = await incrementRetentionContactCount(supabase, enrollmentId, "whatsapp");
    if (!inc.ok) {
      logServerActionInvariantViolation("recordRetentionWhatsappContactAction", "rpc_failed", {
        enrollmentId,
        message: inc.message,
      });
      return { ok: false, code: "save" };
    }

    const { rows } = await loadAdminRetentionCandidates(supabase, { cohortId, enrollmentId });
    const contact = rows[0];
    if (contact) {
      const rid = contact.mailUserId ?? contact.studentId;
      if (rid) {
        const { data: adminProf } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();
        const ap = adminProf as { first_name?: string | null; last_name?: string | null } | null;
        const adminDisplayName = formatProfileNameSurnameFirst(ap?.first_name, ap?.last_name, "Admin");
        try {
          await notifyRetentionOutreachInApp({
            supabase,
            adminUserId: user.id,
            adminDisplayName,
            recipientUserId: rid,
            studentLabel: contact.studentLabel,
            sectionName: contact.sectionName,
            locale,
            channel: "whatsapp",
            emailProvider: getEmailProvider(),
          });
        } catch (notifyErr) {
          logServerException("recordRetentionWhatsappContactAction", notifyErr, {
            enrollmentId,
            stage: "notifyRetentionInApp",
          });
        }
      }
    }

    revalidatePath(`/${locale}/dashboard/admin/academic/${cohortId}`, "page");
    return { ok: true };
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message === ADMIN_SESSION_UNAUTHORIZED || e.message === ADMIN_SESSION_FORBIDDEN)
    ) {
      return { ok: false, code: "auth" };
    }
    logServerException("recordRetentionWhatsappContactAction", e, { enrollmentId });
    return { ok: false, code: "auth" };
  }
}
