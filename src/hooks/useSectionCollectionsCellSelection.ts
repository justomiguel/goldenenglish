import { useCallback, useMemo, useState } from "react";
import { buildSectionCollectionsOverdueCellSelection } from "@/lib/billing/buildSectionCollectionsOverdueCellSelection";
import {
  sectionCollectionsCellActionMode,
  type SectionCollectionsCellSelectionMode,
} from "@/lib/billing/sectionCollectionsCellActionability";
import {
  cellKey,
  groupSelectedCellsByStudent,
  parseCellKey,
  type CellKey,
} from "@/lib/billing/sectionCollectionsCellSelectionKeys";
import type { SectionCollectionsStudentRow } from "@/types/sectionCollections";

export type { CellKey };
export { cellKey, parseCellKey };

export interface SectionCollectionsCellSelectionContext {
  students: SectionCollectionsStudentRow[];
  year: number;
  sectionStartsOn: string;
  todayMonth: number;
  showEnrollmentFeeColumn: boolean;
}

export interface SectionCellSelectionState {
  selectedCells: Set<CellKey>;
  selectedStudents: Set<string>;
  selectionMode: SectionCollectionsCellSelectionMode | null;
  toggleCell: (studentId: string, month: number) => void;
  toggleStudentRow: (studentId: string, checked: boolean, months: number[]) => void;
  toggleAllStudents: (checked: boolean, students: SectionCollectionsStudentRow[]) => void;
  selectAllOverdue: (
    students: SectionCollectionsStudentRow[],
    year: number,
    todayMonth: number,
    sectionStartsOn: string,
  ) => void;
  clearSelection: () => void;
  selectionCount: number;
  cellsGroupedByStudent: Map<string, number[]>;
  isStudentFullySelected: (studentId: string, availableMonths: number[]) => boolean;
  isCellSelected: (studentId: string, month: number) => boolean;
  isCellSelectable: (studentId: string, month: number) => boolean;
}

function buildStudentMap(students: SectionCollectionsStudentRow[]): Map<string, SectionCollectionsStudentRow> {
  return new Map(students.map((s) => [s.studentId, s]));
}

function resolveCellMode(
  student: SectionCollectionsStudentRow,
  month: number,
  context: SectionCollectionsCellSelectionContext,
): SectionCollectionsCellSelectionMode | null {
  return sectionCollectionsCellActionMode(
    student,
    context.year,
    month,
    context.showEnrollmentFeeColumn,
    context.sectionStartsOn,
    context.todayMonth,
  );
}

export function useSectionCollectionsCellSelection(
  context?: SectionCollectionsCellSelectionContext,
): SectionCellSelectionState {
  const [selectedCells, setSelectedCells] = useState<Set<CellKey>>(new Set());

  const studentById = useMemo(
    () => (context ? buildStudentMap(context.students) : null),
    [context],
  );

  const isCellSelectable = useCallback(
    (studentId: string, month: number): boolean => {
      if (!context || !studentById) return true;
      const student = studentById.get(studentId);
      if (!student) return false;
      return resolveCellMode(student, month, context) != null;
    },
    [context, studentById],
  );

  const selectionMode = useMemo((): SectionCollectionsCellSelectionMode | null => {
    if (selectedCells.size === 0 || !context || !studentById) return null;
    const firstKey = [...selectedCells][0]!;
    const { studentId, month } = parseCellKey(firstKey);
    const student = studentById.get(studentId);
    if (!student) return null;
    return resolveCellMode(student, month, context);
  }, [selectedCells, context, studentById]);

  const toggleCell = useCallback(
    (studentId: string, month: number) => {
      if (!isCellSelectable(studentId, month)) return;

      setSelectedCells((prev) => {
        const key = cellKey(studentId, month);
        if (prev.has(key)) {
          const next = new Set(prev);
          next.delete(key);
          return next;
        }

        if (!context || !studentById) {
          return new Set(prev).add(key);
        }

        const student = studentById.get(studentId);
        if (!student) return prev;

        const clickedMode = resolveCellMode(student, month, context);
        if (!clickedMode) return prev;

        if (prev.size === 0) {
          return new Set([key]);
        }

        const first = [...prev][0]!;
        const parsed = parseCellKey(first);
        const st = studentById.get(parsed.studentId);
        const existingMode = st ? resolveCellMode(st, parsed.month, context) : null;

        if (existingMode && existingMode !== clickedMode) {
          return new Set([key]);
        }

        const next = new Set(prev);
        next.add(key);
        return next;
      });
    },
    [context, studentById, isCellSelectable],
  );

  const toggleStudentRow = useCallback(
    (studentId: string, checked: boolean, months: number[]) => {
      setSelectedCells((prev) => {
        const next = new Set(prev);
        for (const m of months) {
          const key = cellKey(studentId, m);
          if (checked) {
            if (isCellSelectable(studentId, m)) next.add(key);
          } else {
            next.delete(key);
          }
        }
        return next;
      });
    },
    [isCellSelectable],
  );

  const toggleAllStudents = useCallback(
    (checked: boolean, students: SectionCollectionsStudentRow[]) => {
      setSelectedCells((prev) => {
        const next = new Set(prev);
        for (const s of students) {
          for (const cell of s.row.cells) {
            const key = cellKey(s.studentId, cell.month);
            if (checked) {
              if (isCellSelectable(s.studentId, cell.month)) next.add(key);
            } else {
              next.delete(key);
            }
          }
        }
        return next;
      });
    },
    [isCellSelectable],
  );

  const selectAllOverdue = useCallback(
    (
      students: SectionCollectionsStudentRow[],
      year: number,
      todayMonth: number,
      sectionStartsOn: string,
    ) => {
      setSelectedCells(() =>
        buildSectionCollectionsOverdueCellSelection(students, year, todayMonth, sectionStartsOn),
      );
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedCells(new Set());
  }, []);

  const cellsGroupedByStudent = useMemo(
    () => groupSelectedCellsByStudent(selectedCells),
    [selectedCells],
  );

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
    (studentId: string, month: number) => selectedCells.has(cellKey(studentId, month)),
    [selectedCells],
  );

  return {
    selectedCells,
    selectedStudents,
    selectionMode,
    toggleCell,
    toggleStudentRow,
    toggleAllStudents,
    selectAllOverdue,
    clearSelection,
    selectionCount: selectedCells.size,
    cellsGroupedByStudent,
    isStudentFullySelected,
    isCellSelected,
    isCellSelectable,
  };
}
