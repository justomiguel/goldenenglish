"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertCanEditClassReminderPrefs } from "@/lib/notifications/assertCanEditClassReminderPrefs";
import { isValidE164Phone, normalizeE164OrEmpty } from "@/lib/notifications/validateE164Phone";
import { getDictionary } from "@/lib/i18n/dictionaries";

const uuid = z.string().uuid();

const schema = z.object({
  studentId: uuid,
  emailClassPrep: z.boolean(),
  inAppClassUrgent: z.boolean(),
  /** True only when user opted in and enabled WhatsApp delivery */
  whatsappClassUrgent: z.boolean(),
  whatsappPhoneE164: z.string().max(24).optional().nullable(),
});

export async function upsertClassReminderChannelPrefsAction(raw: {
  locale: string;
  studentId: string;
  emailClassPrep: boolean;
  inAppClassUrgent: boolean;
  whatsappClassUrgent: boolean;
  whatsappPhoneE164?: string | null;
}): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(raw.locale);
  const msg = dict.dashboard.student;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: msg.classReminderPrefsError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: msg.classReminderPrefsError };

  const allowed = await assertCanEditClassReminderPrefs(supabase, user.id, parsed.data.studentId);
  if (!allowed) return { ok: false, message: msg.classReminderPrefsError };

  const phone = normalizeE164OrEmpty(parsed.data.whatsappPhoneE164 ?? "");
  if (parsed.data.whatsappClassUrgent && !isValidE164Phone(phone)) {
    return { ok: false, message: msg.classReminderPrefsError };
  }

  const now = new Date().toISOString();
  const optInAt = parsed.data.whatsappClassUrgent ? now : null;

  const { error } = await supabase.from("class_reminder_channel_prefs").upsert(
    {
      student_id: parsed.data.studentId,
      email_class_prep: parsed.data.emailClassPrep,
      in_app_class_urgent: parsed.data.inAppClassUrgent,
      whatsapp_class_urgent: parsed.data.whatsappClassUrgent,
      whatsapp_opt_in_at: optInAt,
      whatsapp_phone_e164: parsed.data.whatsappClassUrgent ? phone : null,
      whatsapp_last_error_code: null,
      updated_at: now,
    } as never,
    { onConflict: "student_id" },
  );

  if (error) return { ok: false, message: msg.classReminderPrefsError };

  revalidatePath(`/${raw.locale}/dashboard/profile`);
  revalidatePath(`/${raw.locale}/dashboard/parent/children/${parsed.data.studentId}`);
  return { ok: true, message: msg.classReminderPrefsSaved };
}
