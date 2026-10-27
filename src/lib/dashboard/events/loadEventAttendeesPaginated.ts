import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";
import { quotePostgrestFilterValue } from "@/lib/supabase/quotePostgrestFilterValue";

export interface EventAttendeePaymentSummary {
  status: string;
  amount: number;
  currency: string;
  gatewayProvider: string | null;
}

export interface EventAttendeeTutorSummary {
  firstName: string;
  lastName: string;
  dniOrPassport: string;
  email: string;
  phone: string;
  relationship: string;
}

export interface EventAttendeeRow {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  dniOrPassport: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  status: string;
  source: string;
  isLocalResident: boolean;
  userId: string | null;
  tutorId: string | null;
  tutor: EventAttendeeTutorSummary | null;
  payment: EventAttendeePaymentSummary | null;
  /** Set on a companion. The holder owns the payment. */
  primaryAttendeeId: string | null;
  createdAt: string;
  familyDiscountClaimed: boolean;
  minorTicketCount: number;
  transferSourceKey?: string | null;
  transferSourceLabel?: string | null;
  transferQuestionAnswer?: string | null;
  seatLabels?: string[];
}

export interface PaginatedEventAttendeesParams {
  eventId: string;
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
}

export interface PaginatedEventAttendeesResult {
  rows: EventAttendeeRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

type EventAttendeeListFilterParams = Pick<PaginatedEventAttendeesParams, "eventId" | "q" | "status">;

function appendEventAttendeeSearchFilter<T extends { or: (filter: string) => T }>(
  query: T,
  q: string,
): T {
    const pattern = quotePostgrestFilterValue(
      `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`,
    );
  const filter = [
    `first_name.ilike.${pattern}`,
    `last_name.ilike.${pattern}`,
    `dni_or_passport.ilike.${pattern}`,
    `email.ilike.${pattern}`,
    `phone.ilike.${pattern}`,
  ].join(",");
  return query.or(filter);
}

export async function loadEventAttendeesCount(
  adminClient: SupabaseClient,
  params: EventAttendeeListFilterParams,
): Promise<number> {
  let countQuery = adminClient
    .from("event_attendees")
    .select("id", { head: true, count: "exact" })
    .eq("event_id", params.eventId);

  if (params.status && params.status !== "all") {
    countQuery = countQuery.eq("status", params.status);
  }

  const q = (params.q ?? "").trim();
  if (q) {
    countQuery = appendEventAttendeeSearchFilter(countQuery, q);
  }

  const { count } = await countQuery;
  return count ?? 0;
}

export async function loadEventAttendeesPaginated(
  adminClient: SupabaseClient,
  params: PaginatedEventAttendeesParams,
): Promise<PaginatedEventAttendeesResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_TABLE_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const q = (params.q ?? "").trim();

  let dataQuery = adminClient
    .from("event_attendees")
    .select(
      "id, event_id, first_name, last_name, dni_or_passport, email, phone, birth_date, status, source, is_local_resident, user_id, tutor_id, tutor_first_name, tutor_last_name, tutor_dni_or_passport, tutor_email, tutor_phone, tutor_relationship, created_at, family_discount_claimed, minor_ticket_count, primary_attendee_id, transfer_source_key, transfer_source_label, transfer_question_answer, seat_labels, event_payments(status, amount, currency, gateway_provider)",
    )
    .eq("event_id", params.eventId);

  let countQuery = adminClient
    .from("event_attendees")
    .select("id", { head: true, count: "exact" })
    .eq("event_id", params.eventId);

  if (params.status && params.status !== "all") {
    dataQuery = dataQuery.eq("status", params.status);
    countQuery = countQuery.eq("status", params.status);
  }

  if (q) {
    dataQuery = appendEventAttendeeSearchFilter(dataQuery, q);
    countQuery = appendEventAttendeeSearchFilter(countQuery, q);
  }

  const [dataResult, countResult] = await Promise.all([
    dataQuery.order("created_at", { ascending: false }).range(from, to),
    countQuery,
  ]);

  const rows: EventAttendeeRow[] = (dataResult.data ?? []).map((row) => {
    const paymentRaw = row.event_payments as
      | { status: string; amount: number; currency: string; gateway_provider: string | null }
      | { status: string; amount: number; currency: string; gateway_provider: string | null }[]
      | null;
    const paymentRow = Array.isArray(paymentRaw) ? paymentRaw[0] : paymentRaw;

    const hasTutor =
      row.tutor_first_name != null ||
      row.tutor_last_name != null ||
      row.tutor_dni_or_passport != null ||
      row.tutor_email != null;

    return {
      id: String(row.id),
      eventId: String(row.event_id),
      firstName: String(row.first_name),
      lastName: String(row.last_name),
      dniOrPassport: String(row.dni_or_passport),
      email: String(row.email),
      phone: row.phone != null ? String(row.phone) : null,
      birthDate: row.birth_date != null ? String(row.birth_date) : null,
      status: String(row.status),
      source: String(row.source ?? "public"),
      isLocalResident: Boolean(row.is_local_resident),
      userId: row.user_id != null ? String(row.user_id) : null,
      tutorId: row.tutor_id != null ? String(row.tutor_id) : null,
      tutor: hasTutor
        ? {
            firstName: String(row.tutor_first_name ?? ""),
            lastName: String(row.tutor_last_name ?? ""),
            dniOrPassport: String(row.tutor_dni_or_passport ?? ""),
            email: String(row.tutor_email ?? ""),
            phone: String(row.tutor_phone ?? ""),
            relationship: String(row.tutor_relationship ?? ""),
          }
        : null,
      payment: paymentRow
        ? {
            status: String(paymentRow.status),
            amount: Number(paymentRow.amount ?? 0),
            currency: String(paymentRow.currency ?? "CLP"),
            gatewayProvider:
              paymentRow.gateway_provider != null ? String(paymentRow.gateway_provider) : null,
          }
        : null,
      primaryAttendeeId:
        row.primary_attendee_id != null ? String(row.primary_attendee_id) : null,
      createdAt: String(row.created_at ?? ""),
      familyDiscountClaimed: row.family_discount_claimed === true,
      minorTicketCount: Number(row.minor_ticket_count ?? 0),
      transferSourceKey:
        row.transfer_source_key != null ? String(row.transfer_source_key) : null,
      transferSourceLabel:
        row.transfer_source_label != null ? String(row.transfer_source_label) : null,
      transferQuestionAnswer:
        row.transfer_question_answer != null ? String(row.transfer_question_answer) : null,
      seatLabels: Array.isArray(row.seat_labels)
        ? row.seat_labels.map((item) => String(item))
        : [],
    };
  });

  return {
    rows,
    totalCount: countResult.count ?? 0,
    page,
    pageSize,
  };
}
