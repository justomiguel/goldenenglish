"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";

const uuid = z.string().uuid();

const watchPayload = z.object({
  locale: z.string().min(1),
  enrollmentId: uuid,
  watch: z.boolean(),
});

export type AdminRetentionWatchState = { ok: true } | { ok: false; code: "auth" | "validation" | "save" };

export async function updateEnrollmentRetentionWatchAdminAction(
  _prev: AdminRetentionWatchState | null,
  formData: FormData,
): Promise<AdminRetentionWatchState> {
  try {
    const { supabase } = await assertAdmin();
    const raw = formData.get("payload");
    const parsed = watchPayload.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const { locale, enrollmentId, watch } = parsed.data;
    const { error } = await supabase.from("enrollment_retention_flags").upsert(
      { enrollment_id: enrollmentId, watch },
      { onConflict: "enrollment_id" },
    );
    if (error) return { ok: false, code: "save" };

    revalidatePath(`/${locale}/dashboard/admin/retention`);
    return { ok: true };
  } catch {
    return { ok: false, code: "auth" };
  }
}
