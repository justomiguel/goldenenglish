export type ClassReminderJobKind = "prep_email" | "urgent_in_app" | "urgent_whatsapp";

export type ClassReminderJobStatus =
  | "pending"
  | "processing"
  | "sent"
  | "failed"
  | "cancelled";

export type WhatsappQuietConfigJson = {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

export type ClassReminderSiteSettings = {
  remindersEnabled: boolean;
  prepOffsetMinutes: number;
  urgentOffsetMinutes: number;
  instituteTimeZone: string;
  whatsappQuiet: WhatsappQuietConfigJson;
};
