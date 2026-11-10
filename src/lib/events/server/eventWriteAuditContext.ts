import { AsyncLocalStorage } from "node:async_hooks";
import type { SupabaseClient } from "@supabase/supabase-js";

export type EventWriteAuditContext = {
  client: SupabaseClient;
  guestSlug: string;
  guestActorId: string;
};

const store = new AsyncLocalStorage<EventWriteAuditContext>();

export function enterEventWriteAudit(context: EventWriteAuditContext): void {
  store.enterWith(context);
}

export function currentEventWriteAudit(): EventWriteAuditContext | null {
  return store.getStore() ?? null;
}
