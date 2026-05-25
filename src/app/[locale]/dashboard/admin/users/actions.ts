"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import type { CreateDashboardUserResult } from "@/lib/dashboard/createDashboardUserInviteResult";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { defaultLocale, getDictionary, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import {
  localizeCreateDashboardUserError,
  localizeCreateDashboardUserZod,
} from "@/lib/dashboard/localizeCreateDashboardUser";
import {
  createDashboardUserSchema,
  planCreateDashboardUserInvite,
} from "@/lib/dashboard/createDashboardUserPlan";
import { runCreateDashboardUserInviteOrchestration } from "@/lib/dashboard/runCreateDashboardUserInviteOrchestration";

export type { CreateDashboardUserResult } from "@/lib/dashboard/createDashboardUserInviteResult";

export async function createDashboardUser(
  raw: z.infer<typeof createDashboardUserSchema>,
): Promise<CreateDashboardUserResult> {
  let actorId = "";
  try {
    const ctx = await assertAdmin();
    actorId = ctx.user.id;
  } catch {
    logServerAuthzDenied("createDashboardUser");
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: localizeCreateDashboardUserError(dict, "forbidden") };
  }

  const localeForDict = typeof raw.locale === "string" ? raw.locale : defaultLocale;
  const parsed = createDashboardUserSchema.safeParse(raw);
  if (!parsed.success) {
    const dict = await getDictionary(localeForDict);
    return {
      ok: false,
      message: localizeCreateDashboardUserZod(dict, parsed.error.issues),
    };
  }

  const dict = await getDictionary(parsed.data.locale ?? defaultLocale);
  const appLocale: AppLocale = locales.includes((parsed.data.locale ?? defaultLocale) as AppLocale)
    ? ((parsed.data.locale ?? defaultLocale) as AppLocale)
    : defaultLocale;

  const pwd = parsed.data.password.trim();
  if (pwd.length > 0 && pwd.length < 6) {
    return { ok: false, message: localizeCreateDashboardUserError(dict, "password_policy") };
  }

  const plan = planCreateDashboardUserInvite(dict, parsed.data);
  if (!plan.ok) {
    return { ok: false, message: plan.message };
  }

  const result = await runCreateDashboardUserInviteOrchestration({
    actorId,
    dict,
    appLocale,
    parsed: parsed.data,
    planOk: plan,
  });

  if (result.ok) {
    revalidatePath(`/${appLocale}/dashboard/admin/users`, "page");
  }

  return result;
}
