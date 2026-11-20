import {
  orderFaqOpenRows,
  parseFaqAdminStats,
  type FaqHomeRow,
} from "@/lib/faq/faqAdminStats";
import {
  logServerActionInvariantViolation,
  logServerException,
  logServerWarn,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

export type FaqHomeCardModel =
  | { ok: true; visits: number; rows: FaqHomeRow[] }
  | { ok: false; code: string };

interface FaqStatsRead {
  data: unknown;
  error: { message?: string; code?: string } | null;
}

/** Return the home card only for the Mozarthitos theme. Other themes do not read the stats. */
export async function loadMozarthitosFaqHomeCard(
  kind: string | null | undefined,
  readStats: () => PromiseLike<FaqStatsRead>,
  items: readonly { id: string; q: string }[],
): Promise<FaqHomeCardModel | null> {
  if (kind !== "mozarthitos") return null;

  let read: FaqStatsRead;
  try {
    read = await readStats();
  } catch (error) {
    void logServerException("faq.adminStats", error, { code: "load_failed" });
    return { ok: false, code: "load_failed" };
  }

  if (read.error) {
    void logSupabaseClientError("faq.adminStats", read.error, { code: "load_failed" });
    return { ok: false, code: "load_failed" };
  }
  if (read.data == null) {
    void logServerWarn("faq.adminStats", { code: "stats_unavailable" });
    return { ok: false, code: "stats_unavailable" };
  }

  const parsed = parseFaqAdminStats(read.data);
  if (!parsed) {
    void logServerActionInvariantViolation("faq.adminStats", "stats_unavailable");
    return { ok: false, code: "stats_unavailable" };
  }

  return {
    ok: true,
    visits: parsed.visits,
    rows: orderFaqOpenRows(items, parsed.opens),
  };
}
