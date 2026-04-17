"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type EnsureCalendarFeedTokenResult =
  | { ok: true; token: string }
  | { ok: false; code: "AUTH" | "SAVE" };

export async function ensureCalendarFeedTokenAction(): Promise<EnsureCalendarFeedTokenResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, code: "AUTH" };

  const { data: row, error: rErr } = await supabase
    .from("profiles")
    .select("calendar_feed_token")
    .eq("id", user.id)
    .maybeSingle();
  if (rErr) {
    logSupabaseClientError("ensureCalendarFeedTokenAction:select", rErr, { userId: user.id });
    return { ok: false, code: "SAVE" };
  }
  const existing = row && typeof row === "object" && "calendar_feed_token" in row ? (row as { calendar_feed_token?: string | null }).calendar_feed_token : null;
  if (existing && typeof existing === "string" && existing.length > 0) {
    return { ok: true, token: existing };
  }

  const token = randomUUID();
  const { error: uErr } = await supabase.from("profiles").update({ calendar_feed_token: token }).eq("id", user.id);
  if (uErr) {
    logSupabaseClientError("ensureCalendarFeedTokenAction:update", uErr, { userId: user.id });
    return { ok: false, code: "SAVE" };
  }

  await recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.portalCalendar,
    metadata: { op: "calendar_feed_token_issued" },
  });

  return { ok: true, token };
}

/** Replaces an existing feed token so old subscription URLs stop receiving updates. */
export async function rotateCalendarFeedTokenAction(): Promise<EnsureCalendarFeedTokenResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, code: "AUTH" };

  const token = randomUUID();
  const { error: uErr } = await supabase.from("profiles").update({ calendar_feed_token: token }).eq("id", user.id);
  if (uErr) {
    logSupabaseClientError("rotateCalendarFeedTokenAction:update", uErr, { userId: user.id });
    return { ok: false, code: "SAVE" };
  }

  await recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.portalCalendar,
    metadata: { op: "calendar_feed_token_rotated" },
  });

  return { ok: true, token };
}
