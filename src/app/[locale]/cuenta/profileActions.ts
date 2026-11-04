"use server";

import { revalidatePath } from "next/cache";
import { logServerActionException } from "@/lib/logging/serverActionLog";
import { savePlatformUserProfile } from "@/lib/pulsar/platformUserProfileStore";
import { createPulsarServerClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

export async function savePulsarProfileAction(input: {
  locale: string;
  displayName: string;
  phone: string;
  photoBase64?: string;
  photoMime?: string;
}): Promise<{ ok: true } | { ok: false; errorCode: "invalid_name" | "invalid_phone" | "invalid_photo" | "save_failed" | "session" }> {
  try {
    if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "save_failed" };
    const server = await createPulsarServerClient();
    const {
      data: { user },
    } = await server.auth.getUser();
    if (!user) return { ok: false, errorCode: "session" };
    const saved = await savePlatformUserProfile({
      userId: user.id,
      displayName: input.displayName,
      phone: input.phone,
      photoBase64: input.photoBase64,
      photoMime: input.photoMime,
    });
    if (!saved.ok) return saved;
    revalidatePath(`/${input.locale}/cuenta/perfil`);
    revalidatePath(`/${input.locale}/admin/perfil`);
    return { ok: true };
  } catch (err) {
    logServerActionException("savePulsarProfileAction", err);
    return { ok: false, errorCode: "save_failed" };
  }
}
