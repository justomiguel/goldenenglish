/** `datetime-local` value (local wall clock) from an ISO / DB timestamptz string. */
export function isoToEventDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parse `datetime-local` input to ISO string (same semantics as create-event form). */
export function eventDatetimeLocalToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const iso = new Date(trimmed).toISOString();
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}
