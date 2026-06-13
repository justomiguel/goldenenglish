import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeBankTransferInstructions } from "@/lib/billing/sanitizeBankTransferInstructions";

export interface BankTransferInstructionsSetting {
  instructions: string | null;
}

function parseStoredValue(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") return sanitizeBankTransferInstructions(raw);
  if (typeof raw === "object" && raw !== null && "instructions" in raw) {
    const nested = (raw as { instructions?: unknown }).instructions;
    return typeof nested === "string" ? sanitizeBankTransferInstructions(nested) : null;
  }
  return sanitizeBankTransferInstructions(String(raw));
}

/** Load institute-wide bank transfer instructions from site_settings. */
export async function loadBankTransferInstructionsSetting(
  supabase: SupabaseClient,
): Promise<BankTransferInstructionsSetting> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "bank_transfer_instructions")
    .maybeSingle();

  if (!data?.value) {
    return { instructions: null };
  }

  return { instructions: parseStoredValue(data.value) };
}
