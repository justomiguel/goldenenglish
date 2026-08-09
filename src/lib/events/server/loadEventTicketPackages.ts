import type { SupabaseClient } from "@supabase/supabase-js";

export interface EventTicketPackageRow {
  id: string;
  name: string;
  price: number;
  /** Null means the package has no capacity of its own; only the event's applies. */
  capacity: number | null;
  benefits: string[];
  position: number;
  archivedAt: string | null;
}

const COLUMNS = "id, name, price, capacity, benefits, position, archived_at";

/** Seats that count against capacity — the same rule the enroll RPC applies. */
const OCCUPYING_STATUSES = ["confirmed", "pending_payment"];

export async function loadEventTicketPackages(
  supabase: SupabaseClient,
  eventId: string,
  opts: { includeArchived?: boolean } = {},
): Promise<EventTicketPackageRow[]> {
  let query = supabase.from("event_ticket_packages").select(COLUMNS).eq("event_id", eventId);

  if (!opts.includeArchived) query = query.is("archived_at", null);

  const { data } = await query
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      id: String(row.id),
      name: String(row.name ?? ""),
      price: Number(row.price ?? 0),
      capacity: row.capacity == null ? null : Number(row.capacity),
      benefits: Array.isArray(row.benefits) ? row.benefits.map((b) => String(b)) : [],
      position: Number(row.position ?? 0),
      archivedAt: row.archived_at == null ? null : String(row.archived_at),
    };
  });
}

/**
 * Seats already taken, per package. Counted with the same two statuses the RPC
 * uses, so the availability a buyer reads matches the one the database enforces.
 */
export async function loadEventTicketPackageSeatsSold(
  supabase: SupabaseClient,
  eventId: string,
): Promise<Map<string, number>> {
  const { data } = await supabase
    .from("event_attendees")
    .select("ticket_package_id")
    .eq("event_id", eventId)
    .in("status", OCCUPYING_STATUSES);

  const sold = new Map<string, number>();
  for (const raw of data ?? []) {
    const packageId = (raw as Record<string, unknown>).ticket_package_id;
    if (packageId == null) continue;
    const key = String(packageId);
    sold.set(key, (sold.get(key) ?? 0) + 1);
  }
  return sold;
}
