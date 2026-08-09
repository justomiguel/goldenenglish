import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeEventDescriptionHtml } from "@/lib/events/sanitizeEventDescriptionHtml";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";

export interface EventMutationResult {
  ok: boolean;
  message?: string;
  eventId?: string;
}

export function adminEventsPath(locale: string): string {
  return `/${locale}/dashboard/admin/events`;
}

export function sanitizeEventDescriptionInput(raw?: string): string {
  return sanitizeEventDescriptionHtml(raw ?? "");
}

/**
 * Anything that changes what the registration form asks or charges has to reach
 * the public pages too, not just the admin detail.
 */
export async function revalidateEventFormSurfaces(locale: string, eventId: string): Promise<void> {
  revalidatePath(adminEventsPath(locale), "page");
  revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
  const admin = createAdminClient();
  const { data: slugRow } = await admin.from("events").select("slug").eq("id", eventId).maybeSingle();
  if (slugRow?.slug) {
    const slug = String(slugRow.slug);
    revalidatePath(`/${locale}/events/${slug}`, "page");
    revalidatePath(`/${locale}/events/${slug}/register`, "page");
  }
}

export async function requireAdminEventActor(): Promise<string | null> {
  try {
    const { user } = await assertAdmin();
    return user.id;
  } catch {
    logServerAuthzDenied("adminEventsAction");
    return null;
  }
}
