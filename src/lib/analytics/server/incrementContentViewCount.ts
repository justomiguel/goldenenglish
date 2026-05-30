import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

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

export async function incrementContentViewCount(
  supabase: SupabaseClient,
  input: IncrementContentViewCountInput,
): Promise<{ ok: boolean; deduped: boolean }> {
  const dedupeSince = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
  if (input.userId || input.sessionKey) {
    let dedupeQuery = supabase
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
    } else if ((dedupeRows ?? []).length > 0) {
      return { ok: true, deduped: true };
    }
  }

  const { error: eventError } = await supabase.from("user_events").insert({
    user_id: input.userId ?? null,
    event_type: "action",
    entity: input.entity,
    metadata: buildViewMetadata(input.kind, input.resourceId, input.sessionKey),
  });
  if (eventError) {
    logSupabaseClientError(`${input.logScope}.event`, eventError, {
      resourceId: input.resourceId,
    });
  }

  const ok = await input.incrementStoredCount(supabase);
  return { ok, deduped: false };
}
