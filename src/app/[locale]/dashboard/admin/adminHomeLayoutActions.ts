"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_HOME_WIDGET_IDS,
  readAdminHomeLayout,
  type AdminHomeLayout,
  type AdminHomeWidgetId,
} from "@/lib/dashboard/adminHomeLayout";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import {
  logServerActionException,
  logServerAuthzDenied,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { loadMerchEnabled } from "@/lib/shop/loadMerchEnabled";

const widgetIds = ADMIN_HOME_WIDGET_IDS as unknown as [AdminHomeWidgetId, ...AdminHomeWidgetId[]];

const layoutSchema = z.object({
  version: z.literal(1),
  items: z.array(
    z.object({
      id: z.enum(widgetIds),
      size: z.enum(["s", "m", "l", "full"]),
      hidden: z.boolean(),
    }),
  ),
});

const localeSchema = z.string().min(2).max(8);

export type AdminHomeLayoutActionResult =
  | { ok: true }
  | { ok: false; code: "forbidden" | "invalid" | "save_failed" };

async function requireAdmin() {
  try {
    return await assertAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === ADMIN_SESSION_UNAUTHORIZED || message === ADMIN_SESSION_FORBIDDEN) {
      logServerAuthzDenied("adminHomeLayout.save", { code: message });
      return null;
    }
    throw error;
  }
}

function revalidateAdminHome(locale: string) {
  revalidatePath(`/${locale}/dashboard/admin`);
}

export async function saveAdminHomeLayoutAction(input: {
  locale: string;
  layout: AdminHomeLayout;
}): Promise<AdminHomeLayoutActionResult> {
  const parsedLocale = localeSchema.safeParse(input.locale);
  const parsedLayout = layoutSchema.safeParse(input.layout);
  if (!parsedLocale.success || !parsedLayout.success) return { ok: false, code: "invalid" };

  const session = await requireAdmin();
  if (!session) return { ok: false, code: "forbidden" };

  try {
    const shopEnabled = await loadMerchEnabled();
    const layout = readAdminHomeLayout(parsedLayout.data, { shopEnabled });
    const { error } = await session.supabase.from("admin_home_layouts").upsert(
      {
        profile_id: session.user.id,
        layout,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" },
    );
    if (error) {
      logSupabaseClientError("adminHomeLayout.save", error, { profileId: session.user.id });
      return { ok: false, code: "save_failed" };
    }
    revalidateAdminHome(parsedLocale.data);
    return { ok: true };
  } catch (error) {
    logServerActionException("adminHomeLayout.save", error, { profileId: session.user.id });
    return { ok: false, code: "save_failed" };
  }
}

export async function deleteAdminHomeLayoutAction(input: {
  locale: string;
}): Promise<AdminHomeLayoutActionResult> {
  const parsedLocale = localeSchema.safeParse(input.locale);
  if (!parsedLocale.success) return { ok: false, code: "invalid" };

  const session = await requireAdmin();
  if (!session) return { ok: false, code: "forbidden" };

  try {
    const { error } = await session.supabase
      .from("admin_home_layouts")
      .delete()
      .eq("profile_id", session.user.id);
    if (error) {
      logSupabaseClientError("adminHomeLayout.delete", error, { profileId: session.user.id });
      return { ok: false, code: "save_failed" };
    }
    revalidateAdminHome(parsedLocale.data);
    return { ok: true };
  } catch (error) {
    logServerActionException("adminHomeLayout.delete", error, { profileId: session.user.id });
    return { ok: false, code: "save_failed" };
  }
}
