import { getDashboardActor } from "@/lib/dashboard/getDashboardActor";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const VIEW_AS_READ_ONLY_CODE = "view_as_read_only" as const;

export async function assertNotViewAs(): Promise<
  { ok: true } | { ok: false; code: typeof VIEW_AS_READ_ONLY_CODE }
> {
  const actor = await getDashboardActor();
  if (actor?.viewAs) return { ok: false, code: VIEW_AS_READ_ONLY_CODE };
  return { ok: true };
}

export function viewAsReadOnlyMessage(message: string | undefined, fallback: string): string {
  return message?.trim() || fallback;
}

export async function viewAsBlockedActionError(locale: string): Promise<string | null> {
  const gate = await assertNotViewAs();
  if (!gate.ok) {
    const dict = await getDictionary(locale);
    return dict.dashboard.viewAs.readOnlyError;
  }
  return null;
}
