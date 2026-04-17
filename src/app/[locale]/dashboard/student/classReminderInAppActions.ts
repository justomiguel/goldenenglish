"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();

export async function markClassReminderInAppReadAction(
  locale: string,
  id: string,
): Promise<{ ok: boolean }> {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) return { ok: false };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase
    .from("class_reminder_in_app")
    .update({ read_at: new Date().toISOString() } as never)
    .eq("id", parsed.data)
    .eq("recipient_user_id", user.id);
  if (error) return { ok: false };
  revalidatePath(`/${locale}/dashboard/student`);
  return { ok: true };
}
