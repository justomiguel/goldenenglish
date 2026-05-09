"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logServerException } from "@/lib/logging/serverActionLog";
import { loadSectionCollectionsPaymentHistoryPage } from "@/lib/billing/loadSectionCollectionsPaymentHistoryPage";
import type { SectionCollectionsPaymentHistoryRow } from "@/types/sectionCollectionsTabs";

const inputSchema = z.object({
  locale: z.string(),
  sectionId: z.string().uuid(),
  page: z.number().int().min(1).max(10_000),
  pageSize: z.number().int().min(1).max(50).optional(),
});

export type SectionCollectionsPaymentHistoryActionResult =
  | { ok: true; rows: SectionCollectionsPaymentHistoryRow[]; total: number }
  | { ok: false; message: string };

export async function getSectionCollectionsPaymentHistoryAction(
  raw: z.infer<typeof inputSchema>,
): Promise<SectionCollectionsPaymentHistoryActionResult> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Invalid input" };
  }

  const dict = await getDictionary(parsed.data.locale);
  const msg = dict.admin.finance.collections.sectionTabs;

  try {
    const { supabase } = await assertAdmin();
    const { rows, total } = await loadSectionCollectionsPaymentHistoryPage(
      supabase,
      parsed.data.sectionId,
      { page: parsed.data.page, pageSize: parsed.data.pageSize ?? 20 },
    );
    return { ok: true, rows, total };
  } catch (err) {
    logServerException("getSectionCollectionsPaymentHistoryAction", err, {
      sectionId: parsed.data.sectionId,
    });
    return { ok: false, message: msg.historyLoadError };
  }
}
