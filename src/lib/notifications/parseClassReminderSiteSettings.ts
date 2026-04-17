import type { ClassReminderSiteSettings, WhatsappQuietConfigJson } from "@/types/classReminders";

function jsonbBoolean(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (v && typeof v === "object" && "enabled" in v) {
    return Boolean((v as { enabled?: boolean }).enabled);
  }
  return null;
}

function jsonbNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  if (v && typeof v === "object") {
    const j = v as { toString?: () => string };
    if (typeof j.toString === "function") {
      const n = Number(String(v));
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

function jsonbString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
}

function parseQuiet(raw: unknown): WhatsappQuietConfigJson {
  const fallback: WhatsappQuietConfigJson = {
    startHour: 22,
    startMinute: 0,
    endHour: 8,
    endMinute: 1,
  };
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  const sh = jsonbNumber(o.startHour);
  const sm = jsonbNumber(o.startMinute);
  const eh = jsonbNumber(o.endHour);
  const em = jsonbNumber(o.endMinute);
  if (
    sh == null ||
    sm == null ||
    eh == null ||
    em == null ||
    sh < 0 ||
    sh > 23 ||
    sm < 0 ||
    sm > 59 ||
    eh < 0 ||
    eh > 23 ||
    em < 0 ||
    em > 59
  ) {
    return fallback;
  }
  return { startHour: sh, startMinute: sm, endHour: eh, endMinute: em };
}

/** Parses rows from `site_settings` key→value JSONB (Supabase returns parsed object). */
export function parseClassReminderSiteSettings(rows: Record<string, unknown>[]): ClassReminderSiteSettings {
  const map = Object.fromEntries(rows.map((r) => [(r as { key: string }).key, (r as { value: unknown }).value]));

  const enabledRaw = map.class_reminders_enabled;
  const remindersEnabled = jsonbBoolean(enabledRaw) ?? false;

  const prep = jsonbNumber(map.class_reminder_prep_offset_minutes) ?? 1440;
  const urgent = jsonbNumber(map.class_reminder_urgent_offset_minutes) ?? 30;

  const tzRaw = map.class_reminder_institute_tz;
  const instituteTimeZone = jsonbString(tzRaw) ?? "America/Argentina/Cordoba";

  const whatsappQuiet = parseQuiet(map.class_reminder_whatsapp_quiet);

  return {
    remindersEnabled,
    prepOffsetMinutes: Math.max(1, Math.min(10080, Math.floor(prep))),
    urgentOffsetMinutes: Math.max(1, Math.min(1440, Math.floor(urgent))),
    instituteTimeZone,
    whatsappQuiet,
  };
}
