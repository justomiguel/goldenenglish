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

function pathnameOf(next: string): string {
  const noQuery = next.split("?")[0] ?? next;
  if (noQuery.length > 1 && noQuery.endsWith("/")) return noQuery.slice(0, -1);
  return noQuery;
}

/** Fleet home and its login hop. Owners cannot open these paths. */
function isStaffFleetHome(locale: string, next: string): boolean {
  const path = pathnameOf(next);
  return path === `/${locale}/admin` || path === `/${locale}/admin/login`;
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
  if (cookie) {
    if (!safe || isStaffFleetHome(locale, safe)) return `/${locale}/cuenta`;
    return safe;
  }
  return `/${locale}/cuenta/login`;
}
