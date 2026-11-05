const ipHits = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

export function clientIp(request: Request): string {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "default")
    .trim()
    .toLowerCase();
  const xf = request.headers.get("x-forwarded-for");
  const ip = xf
    ? (xf.split(",")[0]?.trim() ?? "unknown")
    : (request.headers.get("x-real-ip")?.trim() ?? "unknown");
  return `${host}|${ip}`;
}

export function isSeatRequestLimited(ip: string): boolean {
  const now = Date.now();
  const current = ipHits.get(ip);
  if (!current || now - current.ts > RATE_LIMIT_WINDOW_MS) {
    ipHits.set(ip, { count: 1, ts: now });
    return false;
  }
  current.count += 1;
  current.ts = now;
  ipHits.set(ip, current);
  return current.count > RATE_LIMIT_MAX;
}

export const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" } as const;
