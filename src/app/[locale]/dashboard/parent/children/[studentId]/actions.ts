"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pickLocaleFromUnknownPayload } from "@/lib/parent/pickLocaleFromUnknownPayload";

const schema = z.object({
  locale: z.string().min(2).max(8),
  studentId: z.string().uuid(),
  first_name: z.string().trim().min(1).max(120),
  last_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(40),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  email: z.string().trim().email().max(254),
});

export type UpdateWardProfileInput = z.infer<typeof schema>;

export async function updateWardProfile(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const d = await getDictionary(pickLocaleFromUnknownPayload(raw));
    return { ok: false, message: d.dashboard.parent.wardInvalidForm };
  }

  const dict = await getDictionary(parsed.data.locale);
  const L = dict.dashboard.parent;
  const amsg = dict.actionErrors.messaging;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: amsg.unauthorized };

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "parent") return { ok: false, message: L.wardForbidden };

  const { data: link } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", user.id)
    .eq("student_id", parsed.data.studentId)
    .maybeSingle();
  if (!link) return { ok: false, message: L.wardForbidden };

  const nextEmail = parsed.data.email.trim().toLowerCase();
  const admin = createAdminClient();
  const { data: authData, error: authReadErr } = await admin.auth.admin.getUserById(
    parsed.data.studentId,
  );
  if (authReadErr || !authData?.user) {
    return { ok: false, message: L.wardAuthLookupFailed };
  }
  const currentEmail = (authData.user.email ?? "").trim().toLowerCase();

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      phone: parsed.data.phone,
      birth_date: parsed.data.birth_date,
    })
    .eq("id", parsed.data.studentId);

  if (error) return { ok: false, message: L.wardError };

  if (nextEmail !== currentEmail) {
    const { error: authErr } = await admin.auth.admin.updateUserById(parsed.data.studentId, {
      email: nextEmail,
      email_confirm: true,
    });
    if (authErr) {
      const m = authErr.message.toLowerCase();
      if (m.includes("already") || m.includes("registered") || m.includes("unique")) {
        return { ok: false, message: L.wardEmailTaken };
      }
      return { ok: false, message: L.wardError };
    }
  }

  const loc = parsed.data.locale;
  revalidatePath(`/${loc}/dashboard/parent`);
  revalidatePath(`/${loc}/dashboard/parent/children/${parsed.data.studentId}`);
  return { ok: true };
}
