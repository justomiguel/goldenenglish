import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError, logServerWarn } from "@/lib/logging/serverActionLog";

export type ContentViewKind = "article_view" | "event_view";

const DEDUPE_WINDOW_MS = 30 * 60_000;

export interface IncrementContentViewCountInput {
  resourceId: string;
  entity: string;
  kind: ContentViewKind;
  userId?: string | null;
  sessionKey?: string | null;
  logScope: string;
  incrementStoredCount: (supabase: SupabaseClient) => Promise<boolean>;
}

function buildViewMetadata(
  kind: ContentViewKind,
  resourceId: string,
  sessionKey: string | null | undefined,
): Record<string, unknown> {
  const base = { kind, sessionKey: sessionKey ?? null };
  if (kind === "article_view") {
    return { ...base, articleId: resourceId };
  }
  return { ...base, eventId: resourceId };
}

function resolveTelemetryClient(
  sessionClient: SupabaseClient,
  userId: string | null | undefined,
): SupabaseClient | null {
  try {
    // user_events RLS only allows authenticated self-inserts; public view telemetry runs server-side.
    return createAdminClient();
  } catch (err) {
    if (userId) return sessionClient;
    logServerWarn("analytics.incrementContentViewCount.telemetry", {
      reason: "admin_client_unavailable",
      message: err instanceof Error ? err.message : "missing_service_role",
    });
    return null;
  }
}

async function findRecentContentView(
  telemetryClient: SupabaseClient,
  input: IncrementContentViewCountInput,
  dedupeSince: string,
): Promise<{ deduped: boolean; errored: boolean }> {
  if (!input.userId && !input.sessionKey) {
    return { deduped: false, errored: false };
  }

  let dedupeQuery = telemetryClient
    .from("user_events")
    .select("id")
    .eq("event_type", "action")
    .eq("entity", input.entity)
    .gte("created_at", dedupeSince)
    .contains("metadata", { kind: input.kind });

  if (input.userId) dedupeQuery = dedupeQuery.eq("user_id", input.userId);
  if (input.sessionKey) {
    dedupeQuery = dedupeQuery.contains("metadata", { sessionKey: input.sessionKey });
  }

  const { data: dedupeRows, error: dedupeError } = await dedupeQuery.limit(1);
  if (dedupeError) {
    logSupabaseClientError(`${input.logScope}.dedupe`, dedupeError, {
      resourceId: input.resourceId,
    });
    return { deduped: false, errored: true };
  }

  return { deduped: (dedupeRows ?? []).length > 0, errored: false };
}

async function recordContentViewEvent(
  telemetryClient: SupabaseClient,
  input: IncrementContentViewCountInput,
): Promise<boolean> {
  const { error: eventError } = await telemetryClient.from("user_events").insert({
    user_id: input.userId ?? null,
    event_type: "action",
    entity: input.entity,
    metadata: buildViewMetadata(input.kind, input.resourceId, input.sessionKey),
  });
  if (eventError) {
    logSupabaseClientError(`${input.logScope}.event`, eventError, {
      resourceId: input.resourceId,
    });
    return false;
  }
  return true;
}

export async function incrementContentViewCount(
  supabase: SupabaseClient,
  input: IncrementContentViewCountInput,
): Promise<{ ok: boolean; deduped: boolean }> {
  const dedupeSince = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
  const telemetryClient = resolveTelemetryClient(supabase, input.userId);

  if (telemetryClient) {
    const recent = await findRecentContentView(telemetryClient, input, dedupeSince);
    if (recent.deduped) {
      return { ok: true, deduped: true };
    }

    await recordContentViewEvent(telemetryClient, input);
  }

  const ok = await input.incrementStoredCount(supabase);
  return { ok, deduped: false };
}
