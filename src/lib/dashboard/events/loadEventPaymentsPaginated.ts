import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";

export interface EventPaymentAttendeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  dniOrPassport: string;
  email: string;
  phone: string | null;
  status: string;
}

export interface EventPaymentRow {
  id: string;
  eventAttendeeId: string;
  amount: number;
  currency: string;
  status: string;
  gatewayProvider: string | null;
  receiptStoragePath: string | null;
  reviewNotes: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  attendee: EventPaymentAttendeeSummary;
}

export interface PaginatedEventPaymentsParams {
  eventId: string;
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
}

export interface PaginatedEventPaymentsResult {
  rows: EventPaymentRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  statusCounts: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export async function loadEventPaymentsPaginated(
  adminClient: SupabaseClient,
  params: PaginatedEventPaymentsParams,
): Promise<PaginatedEventPaymentsResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_TABLE_PAGE_SIZE;
  const q = (params.q ?? "").trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const attendeeSelect =
    "id, first_name, last_name, dni_or_passport, email, phone, status, event_id";

  let dataQuery = adminClient
    .from("event_payments")
    .select(
      `id, event_attendee_id, amount, currency, status, gateway_provider, receipt_storage_path, review_notes, paid_at, created_at, updated_at, event_attendees!inner(${attendeeSelect})`,
    )
    .eq("event_attendees.event_id", params.eventId);

  let countQuery = adminClient
    .from("event_payments")
    .select("id, event_attendees!inner(event_id)", { head: true, count: "exact" })
    .eq("event_attendees.event_id", params.eventId);

  if (params.status && params.status !== "all") {
    dataQuery = dataQuery.eq("status", params.status);
    countQuery = countQuery.eq("status", params.status);
  }

  if (q) {
    const pattern = `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    const filter = [
      `first_name.ilike.${pattern}`,
      `last_name.ilike.${pattern}`,
      `dni_or_passport.ilike.${pattern}`,
      `email.ilike.${pattern}`,
    ].join(",");
    dataQuery = dataQuery.or(filter, { referencedTable: "event_attendees" });
    countQuery = countQuery.or(filter, { referencedTable: "event_attendees" });
  }

  const [dataResult, countResult, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    dataQuery.order("created_at", { ascending: false }).range(from, to),
    countQuery,
    adminClient
      .from("event_payments")
      .select("id, event_attendees!inner(event_id)", { head: true, count: "exact" })
      .eq("event_attendees.event_id", params.eventId)
      .eq("status", "pending"),
    adminClient
      .from("event_payments")
      .select("id, event_attendees!inner(event_id)", { head: true, count: "exact" })
      .eq("event_attendees.event_id", params.eventId)
      .eq("status", "approved"),
    adminClient
      .from("event_payments")
      .select("id, event_attendees!inner(event_id)", { head: true, count: "exact" })
      .eq("event_attendees.event_id", params.eventId)
      .eq("status", "rejected"),
  ]);

  const rows: EventPaymentRow[] = (dataResult.data ?? []).map((row) => {
    const attendeeRaw = row.event_attendees as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | null;
    const attendeeRow = Array.isArray(attendeeRaw) ? attendeeRaw[0] : attendeeRaw;

    return {
      id: String(row.id),
      eventAttendeeId: String(row.event_attendee_id),
      amount: Number(row.amount ?? 0),
      currency: String(row.currency ?? "CLP"),
      status: String(row.status),
      gatewayProvider: row.gateway_provider != null ? String(row.gateway_provider) : null,
      receiptStoragePath:
        row.receipt_storage_path != null ? String(row.receipt_storage_path) : null,
      reviewNotes: row.review_notes != null ? String(row.review_notes) : null,
      paidAt: row.paid_at != null ? String(row.paid_at) : null,
      createdAt: String(row.created_at ?? ""),
      updatedAt: String(row.updated_at ?? ""),
      attendee: {
        id: String(attendeeRow?.id ?? row.event_attendee_id),
        firstName: String(attendeeRow?.first_name ?? ""),
        lastName: String(attendeeRow?.last_name ?? ""),
        dniOrPassport: String(attendeeRow?.dni_or_passport ?? ""),
        email: String(attendeeRow?.email ?? ""),
        phone: attendeeRow?.phone != null ? String(attendeeRow.phone) : null,
        status: String(attendeeRow?.status ?? ""),
      },
    };
  });

  return {
    rows,
    totalCount: countResult.count ?? 0,
    page,
    pageSize,
    statusCounts: {
      pending: pendingCount.count ?? 0,
      approved: approvedCount.count ?? 0,
      rejected: rejectedCount.count ?? 0,
    },
  };
}
