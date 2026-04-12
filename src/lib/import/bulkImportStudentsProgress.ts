/** Optional hooks for live import (KV / UI). */
export type BulkImportProgressHooks = {
  onProgress?: (completedRows: number, totalRows: number) => void | Promise<void>;
  /** At the start of each row (1-based index), before heavy work. */
  onRowStart?: (rowIndex: number, totalRows: number) => void | Promise<void>;
  /** When true, call `onProgress` after every row; when false, keep the inherited stride (fewer calls). */
  progressEveryRow?: boolean;
};

export function createImportProgressReporter(
  total: number,
  hooks: BulkImportProgressHooks | undefined,
) {
  const onProgress = hooks?.onProgress;
  const onRowStart = hooks?.onRowStart;
  const progressEveryRow = hooks?.progressEveryRow === true;
  const stride = total > 80 ? 5 : 1;
  let lastReported = -1;

  async function reportDoneRows(doneCount: number) {
    if (!onProgress) return;
    if (progressEveryRow) {
      await onProgress(doneCount, total);
      return;
    }
    if (doneCount !== total && doneCount % stride !== 0) return;
    if (doneCount === lastReported) return;
    lastReported = doneCount;
    await onProgress(doneCount, total);
  }

  return { reportDoneRows, onRowStart };
}
