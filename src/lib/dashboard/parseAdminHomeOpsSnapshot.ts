import { readEmailMonthlyCap } from "@/lib/email/emailMonthlyCap";

export interface AdminHomeOpsEvent {
  id: string;
  slug: string;
  title: string;
  eventDate: string;
  capacity: number | null;
  seats: number;
}

export interface AdminHomeOpsCohort {
  id: string;
  name: string;
  activeEnrollments: number;
}

export interface AdminHomeOpsSnapshot {
  emailUsed: number;
  emailCap: number;
  events: AdminHomeOpsEvent[];
  waitlistTotal: number;
  cohort: AdminHomeOpsCohort | null;
  classesMeeting: number;
  classesMissingAttendance: number;
  trialsBooked: number;
  trialsAttended: number;
  trialsReleased: number;
  sectionsFull: number;
  sectionsOneLeft: number;
  eventPaymentsPendingReview: number;
}

export const EMPTY_ADMIN_HOME_OPS: AdminHomeOpsSnapshot = {
  emailUsed: 0,
  emailCap: 5000,
  events: [],
  waitlistTotal: 0,
  cohort: null,
  classesMeeting: 0,
  classesMissingAttendance: 0,
  trialsBooked: 0,
  trialsAttended: 0,
  trialsReleased: 0,
  sectionsFull: 0,
  sectionsOneLeft: 0,
  eventPaymentsPendingReview: 0,
};

function count(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

function parseEvent(raw: unknown): AdminHomeOpsEvent | null {
  const row = asRecord(raw);
  if (!row || typeof row.id !== "string") return null;
  const capacity = row.capacity == null ? null : count(row.capacity);
  return {
    id: row.id,
    slug: typeof row.slug === "string" ? row.slug : "",
    title: typeof row.title === "string" ? row.title : "",
    eventDate: String(row.event_date ?? row.eventDate ?? ""),
    capacity: capacity === 0 && row.capacity == null ? null : capacity,
    seats: count(row.seats),
  };
}

function parseCohort(raw: unknown): AdminHomeOpsCohort | null {
  const row = asRecord(raw);
  if (!row || typeof row.id !== "string") return null;
  return {
    id: row.id,
    name: typeof row.name === "string" ? row.name : "",
    activeEnrollments: count(row.active_enrollments ?? row.activeEnrollments),
  };
}

export function parseAdminHomeOpsSnapshot(raw: unknown): AdminHomeOpsSnapshot {
  const row = asRecord(raw);
  if (!row) return EMPTY_ADMIN_HOME_OPS;
  const events = Array.isArray(row.events)
    ? row.events.flatMap((item) => {
        const event = parseEvent(item);
        return event ? [event] : [];
      })
    : [];
  return {
    emailUsed: count(row.email_used ?? row.emailUsed),
    emailCap: readEmailMonthlyCap(row.email_cap ?? row.emailCap),
    events,
    waitlistTotal: count(row.waitlist_total ?? row.waitlistTotal),
    cohort: parseCohort(row.cohort),
    classesMeeting: count(row.classes_meeting ?? row.classesMeeting),
    classesMissingAttendance: count(row.classes_missing_attendance ?? row.classesMissingAttendance),
    trialsBooked: count(row.trials_booked ?? row.trialsBooked),
    trialsAttended: count(row.trials_attended ?? row.trialsAttended),
    trialsReleased: count(row.trials_released ?? row.trialsReleased),
    sectionsFull: count(row.sections_full ?? row.sectionsFull),
    sectionsOneLeft: count(row.sections_one_left ?? row.sectionsOneLeft),
    eventPaymentsPendingReview: count(
      row.event_payments_pending_review ?? row.eventPaymentsPendingReview,
    ),
  };
}
