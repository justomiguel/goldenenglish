import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { parseInitialSiteSetupCompletedAt } from "@/lib/site/parseInitialSiteSetupRecord";

export type FirstRunWizardMode = "bootstrap_account" | "site_setup" | "closed";

/**
 * Drives `/setup/first-run`: create first admin when none exist, otherwise finish site setup.
 * Uses service role only on the server — never exposed to the client.
 */
export async function loadFirstRunWizardMode(): Promise<FirstRunWizardMode> {
  if (process.env.SKIP_INITIAL_SITE_SETUP === "1") return "closed";

  try {
    const admin = createAdminClient();

    const { count: adminCount, error: countErr } = await admin
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .eq("role", "admin");
    if (countErr) return "closed";

    const { data: row } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", "initial_site_setup")
      .maybeSingle();

    const completed = parseInitialSiteSetupCompletedAt(row?.value);
    const needsSiteSetup = completed === null;

    if (!needsSiteSetup) return "closed";

    if ((adminCount ?? 0) === 0) return "bootstrap_account";

    return "site_setup";
  } catch {
    return "closed";
  }
}
