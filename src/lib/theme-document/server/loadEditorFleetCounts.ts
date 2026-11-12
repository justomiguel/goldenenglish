import "server-only";

import { logServerException } from "@/lib/logging/serverActionLog";
import { loadVariantFleetCounts } from "@/lib/theme-document/server/loadVariantFleetCounts";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

export async function loadEditorFleetCounts(): Promise<Record<string, number>> {
  if (!isPulsarSupabaseConfigured()) return {};
  try {
    return loadVariantFleetCounts(
      createPulsarAdminClient() as unknown as Parameters<typeof loadVariantFleetCounts>[0],
    );
  } catch (err) {
    await logServerException("themeDocument.fleet", err);
    return {};
  }
}
