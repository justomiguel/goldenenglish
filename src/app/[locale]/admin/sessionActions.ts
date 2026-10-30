"use server";

import { revalidatePath } from "next/cache";
import { logServerActionException, logServerInfo } from "@/lib/logging/serverActionLog";
import { getPulsarCookieSession, getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { safePulsarNext } from "@/lib/pulsar/safePulsarNext";
import { createPulsarServerClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

export async function signOutPulsarSessionAction(locale: string): Promise<{ ok: boolean }> {
  try {
    if (isPulsarSupabaseConfigured()) {
      const supabase = await createPulsarServerClient();
      await supabase.auth.signOut();
    }
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/admin`);
    revalidatePath(`/${locale}/cuenta`);
    logServerInfo("signOutPulsarSessionAction", { locale });
    return { ok: true };
  } catch (err) {
    logServerActionException("signOutPulsarSessionAction", err);
    return { ok: false };
  }
}

export async function resolvePulsarPostLoginPath(
  locale: string,
  next: string | null,
): Promise<string> {
  const safe = safePulsarNext(locale, next);
  const staff = await getPulsarStaffSession();
  if (staff?.mustChangePassword) return `/${locale}/admin/password`;
  if (staff) return safe ?? `/${locale}/admin`;
  const cookie = await getPulsarCookieSession();
  if (cookie) return safe ?? `/${locale}/cuenta`;
  return `/${locale}/cuenta/login`;
}
