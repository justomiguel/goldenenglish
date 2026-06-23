"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { updateBillingCurrencySetting } from "@/lib/billing/updateBillingCurrencySetting";
import { updateBankTransferInstructionsSetting } from "@/lib/billing/updateBankTransferInstructionsSetting";
import { updateEventsBankTransferEnabledSetting } from "@/lib/events/server/updateEventsBankTransferEnabledSetting";
import { EVENTS_BANK_TRANSFER_ENABLED_KEY } from "@/lib/events/eventsBankTransferSetting";

export interface SetBillingCurrencyResult {
  ok: boolean;
  error?: "unauthorized" | "invalid_currency" | "db_error";
}

export async function setBillingCurrencyAction(
  locale: string,
  currency: string,
): Promise<SetBillingCurrencyResult> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("setBillingCurrencyAction");
    return { ok: false, error: "unauthorized" };
  }

  const supabase = await createClient();
  const result = await updateBillingCurrencySetting(supabase, currency);

  if (!result.ok) {
    if (result.error === "invalid_currency") {
      return { ok: false, error: "invalid_currency" };
    }
    logSupabaseClientError("setBillingCurrencyAction", { message: result.error ?? "unknown" }, {
      key: "billing_currency",
    });
    return { ok: false, error: "db_error" };
  }

  void recordSystemAudit({
    action: "billing_currency_update",
    resourceType: "site_settings",
    resourceId: "billing_currency",
    payload: { currency: currency.trim().toUpperCase() },
  });

  revalidatePath(`/${locale}/dashboard/admin/finance`, "layout");
  revalidatePath(`/${locale}/dashboard/admin/academic`, "layout");
  return { ok: true };
}

export interface SetBankTransferInstructionsResult {
  ok: boolean;
  error?: "unauthorized" | "db_error";
}

export async function setBankTransferInstructionsAction(
  locale: string,
  instructions: string,
): Promise<SetBankTransferInstructionsResult> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("setBankTransferInstructionsAction");
    return { ok: false, error: "unauthorized" };
  }

  const supabase = await createClient();
  const result = await updateBankTransferInstructionsSetting(supabase, instructions);

  if (!result.ok) {
    logSupabaseClientError(
      "setBankTransferInstructionsAction",
      { message: result.error ?? "unknown" },
      { key: "bank_transfer_instructions" },
    );
    return { ok: false, error: "db_error" };
  }

  void recordSystemAudit({
    action: "bank_transfer_instructions_update",
    resourceType: "site_settings",
    resourceId: "bank_transfer_instructions",
    payload: { hasInstructions: Boolean(instructions.trim()) },
  });

  revalidatePath(`/${locale}/dashboard/admin/finance`, "layout");
  revalidatePath(`/${locale}/dashboard/student/payments`, "layout");
  revalidatePath(`/${locale}/dashboard/parent/payments`, "layout");
  revalidatePath(`/${locale}/events`, "layout");
  return { ok: true };
}

export interface SetEventsBankTransferEnabledResult {
  ok: boolean;
  error?: "unauthorized" | "db_error";
}

export async function setEventsBankTransferEnabledAction(
  locale: string,
  enabled: boolean,
): Promise<SetEventsBankTransferEnabledResult> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("setEventsBankTransferEnabledAction");
    return { ok: false, error: "unauthorized" };
  }

  const supabase = await createClient();
  const result = await updateEventsBankTransferEnabledSetting(supabase, enabled);

  if (!result.ok) {
    logSupabaseClientError(
      "setEventsBankTransferEnabledAction",
      { message: result.error ?? "unknown" },
      { key: EVENTS_BANK_TRANSFER_ENABLED_KEY },
    );
    return { ok: false, error: "db_error" };
  }

  void recordSystemAudit({
    action: "events_bank_transfer_enabled_update",
    resourceType: "site_settings",
    resourceId: EVENTS_BANK_TRANSFER_ENABLED_KEY,
    payload: { enabled },
  });

  revalidatePath(`/${locale}/dashboard/admin/finance`, "layout");
  revalidatePath(`/${locale}/events`, "layout");
  return { ok: true };
}
