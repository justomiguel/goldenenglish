import { readFileSync, writeFileSync } from "node:fs";

/** Session pooler hosts that publish an A record. aws-1 is tried before aws-0. */
export const SESSION_POOLER_HOSTS = [
  "aws-1-us-east-1.pooler.supabase.com",
  "aws-1-us-east-2.pooler.supabase.com",
  "aws-1-us-west-1.pooler.supabase.com",
  "aws-0-us-east-2.pooler.supabase.com",
  "aws-1-sa-east-1.pooler.supabase.com",
  "aws-1-us-west-2.pooler.supabase.com",
  "aws-1-eu-central-1.pooler.supabase.com",
  "aws-1-eu-west-1.pooler.supabase.com",
  "aws-1-eu-west-2.pooler.supabase.com",
  "aws-1-ap-southeast-1.pooler.supabase.com",
  "aws-1-ap-northeast-1.pooler.supabase.com",
  "aws-1-ca-central-1.pooler.supabase.com",
  "aws-0-us-west-2.pooler.supabase.com",
  "aws-0-us-east-1.pooler.supabase.com",
  "aws-0-sa-east-1.pooler.supabase.com",
  "aws-0-eu-central-1.pooler.supabase.com",
  "aws-0-eu-west-1.pooler.supabase.com",
  "aws-0-eu-west-2.pooler.supabase.com",
  "aws-0-ap-southeast-1.pooler.supabase.com",
  "aws-0-ap-northeast-1.pooler.supabase.com",
  "aws-0-ca-central-1.pooler.supabase.com",
  "aws-0-us-west-1.pooler.supabase.com",
] as const;

export function projectRefFromDirectHost(hostname: string): string | null {
  const match = /^db\.([a-z0-9]+)\.supabase\.co$/i.exec(hostname);
  return match?.[1] ?? null;
}

export function toSessionPoolerUrl(databaseUrl: string, poolerHost: string): string {
  const url = new URL(databaseUrl);
  const ref = projectRefFromDirectHost(url.hostname);
  if (!ref) return databaseUrl;
  url.hostname = poolerHost;
  url.username = `postgres.${ref}`;
  url.port = "5432";
  if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "no-verify");
  return url.toString();
}

export function readPoolerHostCache(filePath: string, ref: string): string | null {
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
    const host = parsed[ref];
    return typeof host === "string" && host.length > 0 ? host : null;
  } catch {
    return null;
  }
}

export function writePoolerHostCache(filePath: string, ref: string, host: string): void {
  let current: Record<string, string> = {};
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") current[key] = value;
    }
  } catch {
    current = {};
  }
  current[ref] = host;
  writeFileSync(filePath, `${JSON.stringify(current, null, 2)}\n`);
}

export async function resolveInstituteDatabaseUrl(
  databaseUrl: string,
  deps: {
    hasIpv4: (hostname: string) => Promise<boolean>;
    canConnect: (url: string) => Promise<boolean>;
    readCache: (ref: string) => string | null;
    writeCache: (ref: string, host: string) => void;
  },
): Promise<string> {
  let hostname = "";
  try {
    hostname = new URL(databaseUrl).hostname;
  } catch {
    return databaseUrl;
  }
  const ref = projectRefFromDirectHost(hostname);
  if (!ref) return databaseUrl;
  if (await deps.hasIpv4(hostname)) return databaseUrl;

  const cached = deps.readCache(ref);
  if (cached) {
    const cachedUrl = toSessionPoolerUrl(databaseUrl, cached);
    if (await deps.canConnect(cachedUrl)) return cachedUrl;
  }

  for (const host of SESSION_POOLER_HOSTS) {
    if (host === cached) continue;
    const candidate = toSessionPoolerUrl(databaseUrl, host);
    if (await deps.canConnect(candidate)) {
      deps.writeCache(ref, host);
      return candidate;
    }
  }

  throw new Error(`no_ipv4_pooler:${ref}`);
}
