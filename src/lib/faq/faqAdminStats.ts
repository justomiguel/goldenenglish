export interface FaqOpenCount {
  questionId: string;
  count: number;
}

export interface FaqAdminStats {
  visits: number;
  opens: FaqOpenCount[];
}

export interface FaqHomeRow {
  id: string;
  question: string;
  opens: number;
}

function isOpenCount(value: unknown): value is FaqOpenCount {
  if (!value || typeof value !== "object") return false;
  const row = value as { questionId?: unknown; count?: unknown };
  return (
    typeof row.questionId === "string" &&
    row.questionId.length > 0 &&
    typeof row.count === "number" &&
    Number.isInteger(row.count) &&
    row.count >= 0
  );
}

/** Map the admin RPC object. Return null when the shape is wrong. */
export function parseFaqAdminStats(payload: unknown): FaqAdminStats | null {
  if (!payload || typeof payload !== "object") return null;
  const row = payload as { visits?: unknown; opens?: unknown };
  if (typeof row.visits !== "number" || !Number.isInteger(row.visits) || row.visits < 0) {
    return null;
  }
  if (!Array.isArray(row.opens) || !row.opens.every(isOpenCount)) return null;
  return { visits: row.visits, opens: row.opens };
}

/** Highest open count first. Equal counts keep the catalog order. An unknown id uses the id as the label. */
export function orderFaqOpenRows(
  items: readonly { id: string; q: string }[],
  opens: readonly FaqOpenCount[],
): FaqHomeRow[] {
  const countById = new Map(opens.map((row) => [row.questionId, row.count]));
  const knownIds = new Set(items.map((item) => item.id));
  const known = items.map((item, index) => ({
    id: item.id,
    question: item.q,
    opens: countById.get(item.id) ?? 0,
    index,
  }));
  const extra = opens
    .filter((row) => !knownIds.has(row.questionId))
    .map((row, index) => ({
      id: row.questionId,
      question: row.questionId,
      opens: row.count,
      index: items.length + index,
    }));
  return [...known, ...extra]
    .sort((a, b) => b.opens - a.opens || a.index - b.index)
    .map(({ id, question, opens: count }) => ({ id, question, opens: count }));
}
