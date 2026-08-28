export function parseRegistrationWaiveReason(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  return value.length > 0 ? value.slice(0, 200) : null;
}
