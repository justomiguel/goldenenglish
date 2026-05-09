import { useCallback, useMemo, useState } from "react";
import type { SectionCollectionsStudentRow } from "@/types/sectionCollections";

export type CellKey = `${string}:${number}`;

export function cellKey(studentId: string, month: number): CellKey {
  return `${studentId}:${month}`;
}

export function parseCellKey(key: CellKey): { studentId: string; month: number } {
  const [studentId, monthStr] = key.split(":");
  return { studentId: studentId!, month: Number(monthStr) };
}

export interface SectionCellSelectionState {
  selectedCells: Set<CellKey>;
  selectedStudents: Set<string>;
  toggleCell: (studentId: string, month: number) => void;
  toggleStudentRow: (studentId: string, checked: boolean, months: number[]) => void;
  toggleAllStudents: (checked: boolean, students: SectionCollectionsStudentRow[]) => void;
  selectAllOverdue: (students: SectionCollectionsStudentRow[], year: number, todayMonth: number) => void;
  clearSelection: () => void;
  selectionCount: number;
  cellsGroupedByStudent: Map<string, number[]>;
  isStudentFullySelected: (studentId: string, availableMonths: number[]) => boolean;
  isCellSelected: (studentId: string, month: number) => boolean;
}

export function useSectionCollectionsCellSelection(): SectionCellSelectionState {
  const [selectedCells, setSelectedCells] = useState<Set<CellKey>>(new Set());

  const toggleCell = useCallback((studentId: string, month: number) => {
    setSelectedCells((prev) => {
      const key = cellKey(studentId, month);
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleStudentRow = useCallback(
    (studentId: string, checked: boolean, months: number[]) => {
      setSelectedCells((prev) => {
        const next = new Set(prev);
        for (const m of months) {
          const key = cellKey(studentId, m);
          if (checked) {
            next.add(key);
          } else {
            next.delete(key);
          }
        }
        return next;
      });
    },
    [],
  );

  const toggleAllStudents = useCallback(
    (checked: boolean, students: SectionCollectionsStudentRow[]) => {
      setSelectedCells((prev) => {
        const next = new Set(prev);
        for (const s of students) {
          for (const cell of s.row.cells) {
            const key = cellKey(s.studentId, cell.month);
            if (checked) {
              next.add(key);
            } else {
              next.delete(key);
            }
          }
        }
        return next;
      });
    },
    [],
  );

  const selectAllOverdue = useCallback(
    (students: SectionCollectionsStudentRow[], year: number, todayMonth: number) => {
      const todayIdx = year * 12 + todayMonth;
      setSelectedCells(() => {
        const next = new Set<CellKey>();
        for (const s of students) {
          for (const cell of s.row.cells) {
            const cellIdx = cell.year * 12 + cell.month;
            const isOverdue = cell.status === "due" && cellIdx < todayIdx;
            if (isOverdue) {
              next.add(cellKey(s.studentId, cell.month));
            }
          }
        }
        return next;
      });
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedCells(new Set());
  }, []);

  const cellsGroupedByStudent = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const key of selectedCells) {
      const { studentId, month } = parseCellKey(key);
      const arr = map.get(studentId) ?? [];
      arr.push(month);
      map.set(studentId, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a - b);
    }
    return map;
  }, [selectedCells]);

  const selectedStudents = useMemo(() => {
    return new Set(cellsGroupedByStudent.keys());
  }, [cellsGroupedByStudent]);

  const isStudentFullySelected = useCallback(
    (studentId: string, availableMonths: number[]) => {
      if (availableMonths.length === 0) return false;
      return availableMonths.every((m) => selectedCells.has(cellKey(studentId, m)));
    },
    [selectedCells],
  );

  const isCellSelected = useCallback(
    (studentId: string, month: number) => {
      return selectedCells.has(cellKey(studentId, month));
    },
    [selectedCells],
  );

  return {
    selectedCells,
    selectedStudents,
    toggleCell,
    toggleStudentRow,
    toggleAllStudents,
    selectAllOverdue,
    clearSelection,
    selectionCount: selectedCells.size,
    cellsGroupedByStudent,
    isStudentFullySelected,
    isCellSelected,
  };
}
