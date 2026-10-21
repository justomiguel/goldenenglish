import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

async function writeStatus(
  admin: SupabaseClient,
  attendeeId: string,
  patch: { status: "consumed" | "released" | "reserved"; consumed_at?: string | null; released_at?: string | null },
  fromStatuses: string[],
): Promise<void> {
  const { error } = await admin
    .from("event_discount_code_redemptions")
    .update(patch)
    .eq("attendee_id", attendeeId)
    .in("status", fromStatuses);
  if (error) {
    logSupabaseClientError("syncEventDiscountRedemption", error, {
      attendeeId,
      status: patch.status,
    });
  }
}

export async function consumeEventDiscountRedemption(
  admin: SupabaseClient,
  attendeeId: string,
): Promise<void> {
  await writeStatus(
    admin,
    attendeeId,
    { status: "consumed", consumed_at: new Date().toISOString() },
    ["reserved"],
  );
}

/** Cancel or a rejected payment returns the use. A 100% code was already consumed. */
export async function releaseEventDiscountRedemption(
  admin: SupabaseClient,
  attendeeId: string,
): Promise<void> {
  await writeStatus(
    admin,
    attendeeId,
    { status: "released", released_at: new Date().toISOString() },
    ["reserved", "consumed"],
  );
}

/** Reverting an approval keeps the use occupied. */
export async function reserveEventDiscountRedemption(
  admin: SupabaseClient,
  attendeeId: string,
): Promise<void> {
  await writeStatus(
    admin,
    attendeeId,
    { status: "reserved", consumed_at: null },
    ["consumed"],
  );
}
