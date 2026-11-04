import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { readEmailMonthlyCap } from "@/lib/email/emailMonthlyCap";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function loadEmailMonthUsage(): Promise<{ used: number; cap: number }> {
  try {
    const admin = await createAdminClient();
    const { data, error } = await admin.rpc("email_send_month_usage");
    if (error) {
      logSupabaseClientError("email.monthlyCap", error, { step: "usage" });
      return { used: 0, cap: readEmailMonthlyCap(undefined) };
    }
    const row = data && typeof data === "object" ? (data as { used?: unknown; cap?: unknown }) : {};
    const used = Number(row.used);
    return {
      used: Number.isFinite(used) && used > 0 ? Math.floor(used) : 0,
      cap: readEmailMonthlyCap(row.cap),
    };
  } catch (err) {
    logServerException("email.monthlyCap", err, { step: "usage" });
    return { used: 0, cap: readEmailMonthlyCap(undefined) };
  }
}

export async function recordEmailSend(input: {
  templateKey: string;
  recipientCount: number;
}): Promise<void> {
  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("email_send_ledger").insert({
      template_key: input.templateKey,
      recipient_count: input.recipientCount,
    });
    if (error) {
      logSupabaseClientError("email.monthlyCap", error, {
        step: "ledger",
        templateKey: input.templateKey,
      });
    }
  } catch (err) {
    logServerException("email.monthlyCap", err, {
      step: "ledger",
      templateKey: input.templateKey,
    });
  }
}
