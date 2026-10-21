import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export const EVENT_DISCOUNT_CODE_USE_CAP = 500;

export interface EventDiscountCodeUse {
  id: string;
  codeId: string;
  attendeeName: string;
  email: string;
  useStatus: "reserved" | "consumed" | "released";
  paymentStatus: "pending" | "approved" | "rejected" | null;
}

interface RawAttendee {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  event_payments?: { status?: string | null } | { status?: string | null }[] | null;
}

export interface RawDiscountCodeUseRow {
  id?: string | null;
  code_id?: string | null;
  status?: string | null;
  event_attendees?: RawAttendee | RawAttendee[] | null;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function paymentStatus(value: string | null | undefined): EventDiscountCodeUse["paymentStatus"] {
  if (value === "pending" || value === "approved" || value === "rejected") return value;
  return null;
}

function redemptionStatus(value: string | null | undefined): EventDiscountCodeUse["useStatus"] | null {
  if (value === "reserved" || value === "consumed" || value === "released") return value;
  return null;
}

/** Turns redemption rows into the Codes tab list. The cap is the newest 500 rows. */
export function mapEventDiscountCodeUses(rows: RawDiscountCodeUseRow[]): {
  uses: EventDiscountCodeUse[];
  truncated: boolean;
} {
  const capped = rows.slice(0, EVENT_DISCOUNT_CODE_USE_CAP);
  const uses: EventDiscountCodeUse[] = [];
  for (const row of capped) {
    const status = redemptionStatus(row.status);
    const attendee = one(row.event_attendees);
    if (!row.id || !row.code_id || !status || !attendee) continue;
    const payment = one(attendee.event_payments);
    uses.push({
      id: String(row.id),
      codeId: String(row.code_id),
      attendeeName: formatProfileNameSurnameFirst(attendee.first_name, attendee.last_name),
      email: String(attendee.email ?? ""),
      useStatus: status,
      paymentStatus: paymentStatus(payment?.status),
    });
  }
  return { uses, truncated: rows.length >= EVENT_DISCOUNT_CODE_USE_CAP };
}
