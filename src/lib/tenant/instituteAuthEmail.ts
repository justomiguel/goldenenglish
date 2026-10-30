const SHARED_TAG = /[^a-z0-9]/g;

/**
 * Shared institutes cannot store the same Auth email twice.
 * Plus-addressing keeps delivery on the visible inbox.
 * Project mode returns the visible email unchanged.
 */
export function instituteAuthEmail(
  visibleEmail: string,
  postgresSchema: string | null | undefined,
): string {
  const visible = visibleEmail.trim().toLowerCase();
  if (!postgresSchema || postgresSchema === "public") return visible;
  const at = visible.lastIndexOf("@");
  if (at <= 0 || at === visible.length - 1) return visible;
  const local = visible.slice(0, at);
  const domain = visible.slice(at + 1);
  const tag = postgresSchema.toLowerCase().replace(SHARED_TAG, "");
  if (!tag) return visible;
  const tagged = local.includes("+") ? `${local}.${tag}` : `${local}+${tag}`;
  return `${tagged}@${domain}`;
}

export function readBrowserPostgresSchema(): string {
  if (typeof window === "undefined") return "public";
  const injected = (
    window as Window & { __GE_TENANT_PUBLIC__?: { postgresSchema?: string } }
  ).__GE_TENANT_PUBLIC__;
  const schema = injected?.postgresSchema?.trim() ?? "";
  return schema.length > 0 ? schema : "public";
}

export function instituteStoragePath(
  postgresSchema: string | null | undefined,
  objectPath: string,
): string {
  if (!postgresSchema || postgresSchema === "public") return objectPath;
  const prefix = `${postgresSchema}/`;
  const normalized = objectPath.replace(/^\/+/, "");
  if (normalized === postgresSchema || normalized.startsWith(prefix)) return normalized;
  return `${prefix}${normalized}`;
}
