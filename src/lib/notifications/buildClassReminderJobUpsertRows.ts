import { maxIso, minIso } from "@/lib/calendar/civilGregorianDate";
import { expandSectionClassOccurrences } from "@/lib/calendar/expandPortalCalendarOccurrences";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { buildClassReminderIdempotencyKey } from "@/lib/notifications/classReminderIdempotency";
import { resolveClassReminderRecipientUserId } from "@/lib/notifications/resolveClassReminderRecipient";
import { shiftUtcInstantOutOfWhatsappQuiet } from "@/lib/notifications/classReminderQuietHours";
import { isoDateInTimeZoneFromUtcMs } from "@/lib/notifications/todayIsoInTimeZone";
import type { ClassReminderJobKind, ClassReminderSiteSettings } from "@/types/classReminders";

export type SyncReminderEnrollmentRow = {
  enrollmentId: string;
  sectionId: string;
  studentId: string;
  isMinor: boolean;
  cohortName: string;
  sectionName: string;
  cohortId: string;
  teacherId: string;
  startsOn: string;
  endsOn: string;
  scheduleSlots: unknown;
  roomLabel: string | null;
  tutorIdsOrdered: string[];
};

export type ClassReminderJobUpsertRow = {
  idempotency_key: string;
  section_enrollment_id: string;
  section_id: string;
  student_id: string;
  recipient_user_id: string;
  occurrence_start_at: string;
  kind: ClassReminderJobKind;
  send_at: string;
  status: "pending";
  payload: Record<string, unknown>;
};

const MAX_OCCURRENCES_PER_ENROLLMENT = 40;

export function buildClassReminderJobUpsertRows(
  row: SyncReminderEnrollmentRow,
  settings: ClassReminderSiteSettings,
  nowMs: number,
): ClassReminderJobUpsertRow[] {
  const recipient = resolveClassReminderRecipientUserId({
    studentId: row.studentId,
    isMinor: row.isMinor,
    tutorIdsOrdered: row.tutorIdsOrdered,
  });
  if ("error" in recipient) {
    return [];
  }

  const slots = parseSectionScheduleSlots(row.scheduleSlots);
  const viewStart = maxIso(row.startsOn, isoDateInTimeZoneFromUtcMs(nowMs, settings.instituteTimeZone));
  const viewEnd = minIso(
    row.endsOn,
    isoDateInTimeZoneFromUtcMs(nowMs + 14 * 24 * 60 * 60 * 1000, settings.instituteTimeZone),
  );
  if (viewStart > viewEnd) return [];

  const title = `${row.cohortName} — ${row.sectionName}`;
  const occ = expandSectionClassOccurrences(
    [
      {
        sectionId: row.sectionId,
        cohortId: row.cohortId,
        cohortLabel: row.cohortName,
        teacherId: row.teacherId,
        roomLabel: row.roomLabel,
        title,
        startsOn: row.startsOn,
        endsOn: row.endsOn,
        scheduleSlots: slots,
      },
    ],
    viewStart,
    viewEnd,
  );

  const out: ClassReminderJobUpsertRow[] = [];
  let occCount = 0;
  for (const o of occ) {
    if (o.kind !== "class" || !o.sectionId) continue;
    occCount += 1;
    if (occCount > MAX_OCCURRENCES_PER_ENROLLMENT) break;
    const occurrenceStartMs = o.startMs;
    if (occurrenceStartMs <= nowMs) continue;

    const occurrenceIso = new Date(occurrenceStartMs).toISOString();
    const prepSendMs = occurrenceStartMs - settings.prepOffsetMinutes * 60 * 1000;
    const urgentSendMs = occurrenceStartMs - settings.urgentOffsetMinutes * 60 * 1000;
    const prepSendIso = new Date(prepSendMs).toISOString();
    const urgentSendIso = new Date(urgentSendMs).toISOString();
    const urgentWhatsappSendIso = shiftUtcInstantOutOfWhatsappQuiet(
      urgentSendIso,
      settings.instituteTimeZone,
      settings.whatsappQuiet,
    );

    const basePayload = {
      sectionLabel: title,
      roomLabel: o.roomLabel ?? null,
      occurrenceStartMs,
    };

    if (prepSendMs >= nowMs) {
      out.push({
        idempotency_key: buildClassReminderIdempotencyKey({
          sectionEnrollmentId: row.enrollmentId,
          occurrenceStartMs,
          kind: "prep_email",
        }),
        section_enrollment_id: row.enrollmentId,
        section_id: row.sectionId,
        student_id: row.studentId,
        recipient_user_id: recipient.recipientUserId,
        occurrence_start_at: occurrenceIso,
        kind: "prep_email",
        send_at: prepSendIso,
        status: "pending",
        payload: { ...basePayload, channel: "email" },
      });
    }

    if (urgentSendMs >= nowMs) {
      out.push({
        idempotency_key: buildClassReminderIdempotencyKey({
          sectionEnrollmentId: row.enrollmentId,
          occurrenceStartMs,
          kind: "urgent_in_app",
        }),
        section_enrollment_id: row.enrollmentId,
        section_id: row.sectionId,
        student_id: row.studentId,
        recipient_user_id: recipient.recipientUserId,
        occurrence_start_at: occurrenceIso,
        kind: "urgent_in_app",
        send_at: urgentSendIso,
        status: "pending",
        payload: { ...basePayload, channel: "in_app" },
      });
      out.push({
        idempotency_key: buildClassReminderIdempotencyKey({
          sectionEnrollmentId: row.enrollmentId,
          occurrenceStartMs,
          kind: "urgent_whatsapp",
        }),
        section_enrollment_id: row.enrollmentId,
        section_id: row.sectionId,
        student_id: row.studentId,
        recipient_user_id: recipient.recipientUserId,
        occurrence_start_at: occurrenceIso,
        kind: "urgent_whatsapp",
        send_at: urgentWhatsappSendIso,
        status: "pending",
        payload: { ...basePayload, channel: "whatsapp" },
      });
    }
  }
  return out;
}
