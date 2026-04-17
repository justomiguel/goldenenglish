"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { z } from "zod";
import { INSTITUTE_TIME_ZONE_IDS } from "@/lib/notifications/instituteTimeZones";

export async function setInscriptionsEnabled(
  locale: string,
  enabled: boolean,
): Promise<{ ok: boolean }> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("setInscriptionsEnabled");
    return { ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "inscriptions_enabled",
      value: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    logSupabaseClientError("setInscriptionsEnabled", error, { key: "inscriptions_enabled" });
    return { ok: false };
  }

  void recordSystemAudit({
    action: "site_settings_upsert",
    resourceType: "site_settings",
    resourceId: "inscriptions_enabled",
    payload: { value: enabled },
  });

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/register`);
  return { ok: true };
}

const classReminderGlobalsSchema = z.object({
  enabled: z.boolean(),
  prepMinutes: z.coerce.number().int().min(30).max(10080),
  urgentMinutes: z.coerce.number().int().min(5).max(720),
  instituteTz: z
    .string()
    .refine((s): s is (typeof INSTITUTE_TIME_ZONE_IDS)[number] =>
      (INSTITUTE_TIME_ZONE_IDS as readonly string[]).includes(s),
    ),
});

export async function setClassRemindersGlobalsAction(input: {
  locale: string;
  enabled: boolean;
  prepMinutes: number;
  urgentMinutes: number;
  instituteTz: string;
}): Promise<{ ok: boolean }> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("setClassRemindersGlobalsAction");
    return { ok: false };
  }

  const parsed = classReminderGlobalsSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const now = new Date().toISOString();
  const rows: { key: string; value: unknown }[] = [
    { key: "class_reminders_enabled", value: parsed.data.enabled },
    { key: "class_reminder_prep_offset_minutes", value: parsed.data.prepMinutes },
    { key: "class_reminder_urgent_offset_minutes", value: parsed.data.urgentMinutes },
    { key: "class_reminder_institute_tz", value: parsed.data.instituteTz },
  ];

  for (const row of rows) {
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: row.key,
        value: row.value as never,
        updated_at: now,
      },
      { onConflict: "key" },
    );
    if (error) {
      logSupabaseClientError("setClassRemindersGlobalsAction", error, { key: row.key });
      return { ok: false };
    }
  }

  void recordSystemAudit({
    action: "class_reminders_settings_upsert",
    resourceType: "site_settings",
    resourceId: "class_reminders_cluster",
    payload: {
      enabled: parsed.data.enabled,
      prepMinutes: parsed.data.prepMinutes,
      urgentMinutes: parsed.data.urgentMinutes,
      instituteTz: parsed.data.instituteTz,
    },
  });

  revalidatePath(`/${input.locale}/dashboard/admin/settings`);
  return { ok: true };
}
