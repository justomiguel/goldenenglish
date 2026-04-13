"use client";

import {
  clearOfflineQueue,
  enqueueOfflineEvent,
  loadOfflineQueue,
  type QueuedEvent,
} from "@/lib/analytics/offlineQueue";
import { browserOriginAbsolutePath } from "@/lib/analytics/browserOriginAbsolutePath";
import { AnalyticsEntity, pathnameToEntity } from "@/lib/analytics/eventConstants";
import { sanitizeAnalyticsMetadata } from "@/lib/analytics/sanitizeMetadata";
import type { UserEventTypeName } from "@/lib/analytics/eventConstants";

type Payload = {
  event_type: UserEventTypeName;
  entity: string;
  metadata?: Record<string, unknown>;
};

function postEvents(events: Payload[], geo?: { country?: string; region?: string }) {
  const merged = events.map((e) => ({
    ...e,
    metadata: sanitizeAnalyticsMetadata({
      ...e.metadata,
      ...(geo?.country ? { geo_country: geo.country } : {}),
      ...(geo?.region ? { geo_region: geo.region } : {}),
    }),
  }));
  const body = JSON.stringify({ events: merged });
  const url = browserOriginAbsolutePath("/api/analytics/events");
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      return navigator.sendBeacon(url, blob);
    }
  } catch {
    /* fall through */
  }
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
  return true;
}

export function trackEvent(
  eventType: UserEventTypeName,
  entity: string,
  metadata?: Record<string, unknown>,
): void {
  const ev: QueuedEvent = {
    event_type: eventType,
    entity,
    metadata: metadata ?? {},
  };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    enqueueOfflineEvent(ev);
    return;
  }
  postEvents([{ event_type: eventType, entity, metadata }]);
}

export function trackPageView(pathname: string, search: string): void {
  const entity = pathnameToEntity(pathname);
  const meta: Record<string, unknown> = { path: pathname };
  if (search) meta.search_len = search.length;
  trackEvent("page_view", entity, meta);
}

export function trackSessionStart(): void {
  trackEvent("session_start", AnalyticsEntity.sessionStart, {});
}

export function flushOfflineAnalyticsQueue(): void {
  const q = loadOfflineQueue();
  if (q.length === 0) return;
  clearOfflineQueue();
  postEvents(
    q.map((e) => ({
      event_type: e.event_type as UserEventTypeName,
      entity: e.entity,
      metadata: e.metadata,
    })),
  );
}
