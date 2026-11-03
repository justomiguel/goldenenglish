export function parseDailyDomain(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) {
    return null;
  }
  if (normalized.includes("://") || normalized.includes("/") || /\s/.test(normalized)) {
    return null;
  }
  return normalized;
}
