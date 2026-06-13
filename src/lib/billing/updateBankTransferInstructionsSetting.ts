import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeBankTransferInstructions } from "@/lib/billing/sanitizeBankTransferInstructions";

export interface UpdateBankTransferInstructionsResult {
  ok: boolean;
  error?: "db_error";
}

export async function updateBankTransferInstructionsSetting(
  supabase: SupabaseClient,
  instructions: string | null | undefined,
): Promise<UpdateBankTransferInstructionsResult> {
  const sanitized = sanitizeBankTransferInstructions(instructions);

  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "bank_transfer_instructions",
      value: sanitized ?? "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    return { ok: false, error: "db_error" };
  }

  return { ok: true };
}
