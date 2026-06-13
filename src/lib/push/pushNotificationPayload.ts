export type PushNotificationPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
};

export function parsePushNotificationPayload(raw: unknown): PushNotificationPayload | null {
  if (raw == null) return null;
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return { title: raw, body: "" };
    }
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  if (!title) return null;
  const body = typeof record.body === "string" ? record.body : "";
  const url = typeof record.url === "string" && record.url.trim() ? record.url.trim() : undefined;
  const icon = typeof record.icon === "string" && record.icon.trim() ? record.icon.trim() : undefined;
  const badge = typeof record.badge === "string" && record.badge.trim() ? record.badge.trim() : undefined;
  return { title, body, url, icon, badge };
}
