import { useCallback, useMemo, useState } from "react";
import type { AdminBillingMonthState } from "@/lib/billing/buildAdminBillingMonthGrid";

function isRevertMonth(st: AdminBillingMonthState): boolean {
  return st.revertSelectable && st.status === "paid";
}

function isRecordMonth(st: AdminBillingMonthState): boolean {
  return st.selectable;
}

export function useAdminRecordPaymentMonthSelection(monthStates: AdminBillingMonthState[]) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const stateByMonth = useMemo(
    () => new Map(monthStates.map((s) => [s.month, s])),
    [monthStates],
  );

  const selectionMode = useMemo((): "record" | "revert" | null => {
    if (selected.size === 0) return null;
    const first = [...selected][0];
    const st = stateByMonth.get(first);
    if (st && isRevertMonth(st)) return "revert";
    return "record";
  }, [selected, stateByMonth]);

  const toggleMonth = useCallback(
    (m: number, next: boolean) => {
      const st = stateByMonth.get(m);
      if (!st) return;

      setSelected((prev) => {
        const c = new Set(prev);
        if (!next) {
          c.delete(m);
          return c;
        }

        const canRecord = isRecordMonth(st);
        const canRevert = isRevertMonth(st);
        if (!canRecord && !canRevert) return c;

        if (c.size === 0) {
          c.add(m);
          return c;
        }

        const selectionWasRevert = [...c].every((mm) => {
          const s = stateByMonth.get(mm);
          return s ? isRevertMonth(s) : false;
        });
        const clickedIsRevert = canRevert && st.status === "paid";
        const clickedIsRecord = canRecord;

        if (selectionWasRevert && clickedIsRecord) {
          return new Set([m]);
        }
        if (!selectionWasRevert && clickedIsRevert) {
          return new Set([m]);
        }

        c.add(m);
        return c;
      });
    },
    [stateByMonth],
  );

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  return {
    selected,
    setSelected,
    toggleMonth,
    clearSelection,
    selectionMode,
  };
}
