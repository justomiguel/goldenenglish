const STORAGE_KEY = "ge_analytics_queue_v1";

export type QueuedEvent = {
  event_type: string;
  entity: string;
  metadata: Record<string, unknown>;
};

export function loadOfflineQueue(): QueuedEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as QueuedEvent[]) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(events: QueuedEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-200)));
  } catch {
    /* quota */
  }
}

export function enqueueOfflineEvent(ev: QueuedEvent): void {
  const q = loadOfflineQueue();
  q.push(ev);
  saveOfflineQueue(q);
}

export function clearOfflineQueue(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
