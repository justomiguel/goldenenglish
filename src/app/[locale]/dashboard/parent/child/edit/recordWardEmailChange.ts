import { createAdminClient } from "@/lib/supabase/admin";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { getBrandForRequest } from "@/lib/brand/server";
import {
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";

export interface WardEmailChangeNotice {
  studentId: string;
  parentId: string;
  parentEmail: string;
  parentName: string;
  wardName: string;
  oldEmail: string;
  newEmail: string;
  locale: Locale;
}

/**
 * Best-effort: persists the audit row and fires the change notification to
 * both the old and the new mailbox. Failures are logged but do not revert the
 * email change. The new credentials are already live. The audit and the
 * notifications are detective controls, not part of the transaction.
 */
export async function recordWardEmailChange(input: WardEmailChangeNotice): Promise<void> {
  const admin = await createAdminClient();

  try {
    const { error: auditErr } = await admin.from("system_config_audit").insert({
      actor_id: input.parentId,
      action: "parent.ward.email_changed",
      resource_type: "auth.user.email",
      resource_id: input.studentId,
      payload: {
        old_email: input.oldEmail,
        new_email: input.newEmail,
        parent_id: input.parentId,
        parent_email: input.parentEmail,
      },
    });
    if (auditErr) {
      logSupabaseClientError("updateWardProfile:audit_insert", auditErr, {
        studentId: input.studentId,
      });
    }
  } catch (e) {
    logServerException("updateWardProfile:audit_insert", e, {
      studentId: input.studentId,
    });
  }

  const brand = await getBrandForRequest();
  const supportEmail = brand.contactEmail?.trim() || input.parentEmail;
  const vars = {
    wardName: input.wardName,
    oldEmail: input.oldEmail,
    newEmail: input.newEmail,
    parentName: input.parentName,
    supportEmail,
  };

  for (const to of dedupe([input.oldEmail, input.newEmail].filter(Boolean))) {
    try {
      const result = await sendBrandedEmail({
        to,
        templateKey: "notifications.ward_email_changed",
        locale: input.locale,
        vars,
      });
      if (!result.ok) {
        logServerException("updateWardProfile:notify", new Error(result.error), {
          to,
          studentId: input.studentId,
        });
      }
    } catch (e) {
      logServerException("updateWardProfile:notify", e, {
        to,
        studentId: input.studentId,
      });
    }
  }
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(value);
    }
  }
  return out;
}
