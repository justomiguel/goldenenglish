import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";
import { batchAuthEmailsForUserIds } from "@/lib/auth/batchAuthEmailsForUserIds";
import { isDeliverableAuthEmail } from "@/lib/auth/isSyntheticAuthEmail";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { AdminWeeklyDigest } from "@/lib/admin-digest/adminWeeklyDigestTypes";

const SCOPE = "admin.weekly_digest";

export async function loadAdminWeeklyDigestPayload(
  admin: SupabaseClient,
  args: {
    weekStart: string;
    weekEnd: string;
    monthStart: string;
    monthEnd: string;
    silentSince: string;
    timeZone: string;
  },
): Promise<{ data: unknown; error: string | null }> {
  const { data, error } = await admin.rpc("admin_weekly_digest", {
    p_week_start: args.weekStart,
    p_week_end: args.weekEnd,
    p_month_start: args.monthStart,
    p_month_end: args.monthEnd,
    p_silent_since: args.silentSince,
    p_tz: args.timeZone,
  });
  if (error) {
    logSupabaseClientError(SCOPE, error, { weekStart: args.weekStart });
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function loadPriorAdminWeeklyDigest(
  admin: SupabaseClient,
  weekStartDate: string,
): Promise<unknown> {
  const { data, error } = await admin
    .from("admin_weekly_digest_sends")
    .select("payload")
    .eq("week_start", weekStartDate)
    .maybeSingle();
  if (error) {
    logSupabaseClientError(SCOPE, error, { weekStart: weekStartDate });
    return null;
  }
  return data?.payload ?? null;
}

export async function claimAdminWeeklyDigestWeek(
  admin: SupabaseClient,
  weekStartDate: string,
  payload: AdminWeeklyDigest,
): Promise<string[] | null> {
  const inserted = await admin.from("admin_weekly_digest_sends").insert({
    week_start: weekStartDate,
    recipient_ids: [],
    payload,
  });
  if (inserted.error && inserted.error.code !== "23505") {
    logSupabaseClientError(SCOPE, inserted.error, { weekStart: weekStartDate });
    return null;
  }
  const existing = await admin
    .from("admin_weekly_digest_sends")
    .select("recipient_ids")
    .eq("week_start", weekStartDate)
    .maybeSingle();
  if (existing.error || !existing.data) {
    logSupabaseClientError(SCOPE, existing.error, { weekStart: weekStartDate });
    return null;
  }
  const ids = existing.data.recipient_ids;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
}

export async function markAdminWeeklyDigestSent(
  admin: SupabaseClient,
  weekStartDate: string,
  recipientIds: string[],
): Promise<void> {
  const { error } = await admin
    .from("admin_weekly_digest_sends")
    .update({
      recipient_ids: recipientIds,
      updated_at: new Date().toISOString(),
    })
    .eq("week_start", weekStartDate);
  if (error) logSupabaseClientError(SCOPE, error, { weekStart: weekStartDate, recipientCount: recipientIds.length });
}

export async function listAdminWeeklyDigestRecipients(
  admin: SupabaseClient,
): Promise<{ id: string; email: string }[]> {
  const { data, error } = await admin.from("profiles").select("id").eq("role", "admin").limit(200);
  if (error || !data) {
    logSupabaseClientError(SCOPE, error);
    return [];
  }
  const ids = (data as { id: string }[])
    .map((row) => row.id)
    .filter((id) => id !== PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID);
  const emails = await batchAuthEmailsForUserIds(ids);
  return ids.flatMap((id) => {
    const email = emails.get(id);
    if (!email || !isDeliverableAuthEmail(email)) return [];
    return [{ id, email }];
  });
}
