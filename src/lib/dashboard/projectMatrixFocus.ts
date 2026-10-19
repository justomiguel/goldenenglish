/** Project a 2D matrix down to one row or one column for a phone editor. */

export function focusMatrixRow<TRow, TColumn>(
  rows: readonly TRow[],
  columns: readonly TColumn[],
  rowId: string,
  rowIdOf: (row: TRow) => string,
): { row: TRow; columns: readonly TColumn[] } | null {
  const row = rows.find((item) => rowIdOf(item) === rowId);
  if (!row) return null;
  return { row, columns };
}

export function focusMatrixColumn<TRow, TColumn>(
  rows: readonly TRow[],
  columns: readonly TColumn[],
  columnId: string,
  columnIdOf: (column: TColumn) => string,
): { column: TColumn; rows: readonly TRow[] } | null {
  const column = columns.find((item) => columnIdOf(item) === columnId);
  if (!column) return null;
  return { column, rows };
}

/** Prefer today, otherwise the latest column that is not in the future. */
export function defaultFocusColumnId(columnIds: readonly string[], todayIso: string): string | null {
  if (columnIds.length === 0) return null;
  if (columnIds.includes(todayIso)) return todayIso;
  const past = columnIds.filter((id) => id <= todayIso);
  return past[past.length - 1] ?? columnIds[0] ?? null;
}
