import { buildEventAttendeeUploadPath } from "@/lib/events/buildEventAttendeeUploadPath";

const RECEIPT_FIELD_ID = "payment-receipt";

export function buildEventPaymentReceiptPath(args: {
  eventId: string;
  attendeeId: string;
  filename: string;
  mime: string;
  now?: number;
}): string {
  return buildEventAttendeeUploadPath({
    eventId: args.eventId,
    attendeeId: args.attendeeId,
    fieldId: RECEIPT_FIELD_ID,
    filename: args.filename,
    mime: args.mime,
    now: args.now,
  });
}
