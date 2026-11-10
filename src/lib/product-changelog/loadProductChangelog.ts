import "server-only";

import { logServerError, logSupabaseError } from "@/lib/logging/serverActionLog";
import {
  PRODUCT_CHANGELOG_AREAS,
  type ProductChangelogArea,
  type ProductChangelogEntry,
} from "@/lib/product-changelog/catalogTypes";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

export const CHANGELOG_UNAVAILABLE = "changelog_unavailable";

const PAGE_SIZE = 1000;

type ChangelogRow = {
  id: string;
  published_on: string;
  area: string;
  title_es: string;
  title_en: string;
  title_pt: string;
  summary_es: string;
  summary_en: string;
  summary_pt: string;
};

function isArea(value: string): value is ProductChangelogArea {
  return (PRODUCT_CHANGELOG_AREAS as readonly string[]).includes(value);
}

export type ProductChangelogLoad =
  | { ok: true; entries: ProductChangelogEntry[] }
  | { ok: false; code: typeof CHANGELOG_UNAVAILABLE; entries: [] };

export async function loadProductChangelogEntries(): Promise<ProductChangelogLoad> {
  if (!isPulsarSupabaseConfigured()) {
    await logServerError("loadProductChangelogEntries", {
      code: CHANGELOG_UNAVAILABLE,
      reason: "pulsar_not_configured",
    });
    return { ok: false, code: CHANGELOG_UNAVAILABLE, entries: [] };
  }

  const admin = createPulsarAdminClient();
  const { data, error } = await admin
    .from("platform_changelog_entries")
    .select(
      "id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position",
    )
    .order("published_on", { ascending: false })
    .order("position", { ascending: true })
    .range(0, PAGE_SIZE - 1);

  if (error) {
    await logSupabaseError("loadProductChangelogEntries", error, { code: CHANGELOG_UNAVAILABLE });
    return { ok: false, code: CHANGELOG_UNAVAILABLE, entries: [] };
  }

  const entries: ProductChangelogEntry[] = [];
  for (const row of (data ?? []) as ChangelogRow[]) {
    if (!isArea(row.area)) continue;
    entries.push({
      id: row.id,
      date: String(row.published_on).slice(0, 10),
      area: row.area,
      title: { es: row.title_es, en: row.title_en, pt: row.title_pt },
      summary: { es: row.summary_es, en: row.summary_en, pt: row.summary_pt },
    });
  }
  return { ok: true, entries };
}
