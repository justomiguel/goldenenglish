import { assertAdmin } from "@/lib/dashboard/assertAdmin";
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

export async function requireAdminEventActor(): Promise<string | null> {
  try {
    const { user } = await assertAdmin();
    return user.id;
  } catch {
    logServerAuthzDenied("adminEventsAction");
    return null;
  }
}
