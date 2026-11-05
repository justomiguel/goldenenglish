/** Inclusive age for a minor ticket. Null means the public page keeps the old sentence. */

export function parseEventMinorMaxAge(value: unknown): number | null {
  if (value == null || value === "") return null;
  const age = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(age) || age < 1 || age > 99) return null;
  return age;
}

export function formatEventMinorAgeLegend(
  template: string,
  age: number | null | undefined,
): string | null {
  const parsed = parseEventMinorMaxAge(age);
  if (parsed == null) return null;
  return template.replaceAll("{{age}}", String(parsed)).replaceAll("{age}", String(parsed));
}

export function eventMinorTicketLabelsWithAge<T extends { hint: string }>(
  labels: T,
  age: number | null | undefined,
  hintWithAge: string,
): T {
  const hint = formatEventMinorAgeLegend(hintWithAge, age);
  return hint ? { ...labels, hint } : labels;
}

export function minorTicketPersistence(input: {
  allowMinorTickets: boolean;
  minorTicketPrice: number | null | undefined;
  minorMaxAge: number | null | undefined;
}):
  | {
      ok: true;
      allow_minor_tickets: boolean;
      minor_ticket_price: number | null;
      minor_max_age: number | null;
    }
  | { ok: false; code: "minor_max_age_required" } {
  if (!input.allowMinorTickets) {
    return {
      ok: true,
      allow_minor_tickets: false,
      minor_ticket_price: null,
      minor_max_age: null,
    };
  }
  const minorMaxAge = parseEventMinorMaxAge(input.minorMaxAge);
  if (minorMaxAge == null) return { ok: false, code: "minor_max_age_required" };
  return {
    ok: true,
    allow_minor_tickets: true,
    minor_ticket_price: input.minorTicketPrice ?? null,
    minor_max_age: minorMaxAge,
  };
}
