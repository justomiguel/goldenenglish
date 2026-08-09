import type { PortalDestination } from "@/lib/portal/portalShellTypes";

function stripTrailingSlash(value: string): string {
  return value.length > 1 ? value.replace(/\/+$/, "") : value;
}

function matches(path: string, candidate: string): boolean {
  const prefix = stripTrailingSlash(candidate);
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function resolveActiveDestination(
  pathname: string,
  destinations: PortalDestination[],
): string | null {
  const path = stripTrailingSlash(pathname);
  let bestId: string | null = null;
  let bestLength = -1;

  for (const destination of destinations) {
    const candidates = [destination.href, ...(destination.matchPrefixes ?? [])];
    for (const candidate of candidates) {
      if (!matches(path, candidate)) continue;
      const length = stripTrailingSlash(candidate).length;
      if (length > bestLength) {
        bestLength = length;
        bestId = destination.id;
      }
    }
  }

  return bestId;
}
