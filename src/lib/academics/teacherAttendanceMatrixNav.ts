import type {
  TeacherAttendanceMatrixCells,
  TeacherAttendanceMatrixPayload,
  TeacherAttendanceMatrixRow,
} from "@/types/teacherAttendanceMatrix";

export function cellIsNavigable(cells: TeacherAttendanceMatrixCells, enrollmentId: string, dateIso: string): boolean {
  return Object.prototype.hasOwnProperty.call(cells[enrollmentId] ?? {}, dateIso);
}

export function buildNavOrderedCells(
  rows: TeacherAttendanceMatrixRow[],
  classDays: string[],
  cells: TeacherAttendanceMatrixCells,
): { enrollmentId: string; dateIso: string }[] {
  const out: { enrollmentId: string; dateIso: string }[] = [];
  for (const r of rows) {
    for (const d of classDays) {
      if (cellIsNavigable(cells, r.enrollmentId, d)) out.push({ enrollmentId: r.enrollmentId, dateIso: d });
    }
  }
  return out;
}

export function gridMoveFocus(
  rows: TeacherAttendanceMatrixRow[],
  classDays: string[],
  cells: TeacherAttendanceMatrixCells,
  current: { enrollmentId: string; dateIso: string },
  key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight",
): { enrollmentId: string; dateIso: string } | null {
  let r = rows.findIndex((x) => x.enrollmentId === current.enrollmentId);
  let c = classDays.indexOf(current.dateIso);
  if (r < 0 || c < 0) return null;

  for (let step = 0; step < 800; step++) {
    if (key === "ArrowRight") {
      c += 1;
      if (c >= classDays.length) {
        c = 0;
        r += 1;
      }
    } else if (key === "ArrowLeft") {
      c -= 1;
      if (c < 0) {
        c = classDays.length - 1;
        r -= 1;
      }
    } else if (key === "ArrowDown") {
      r += 1;
    } else {
      r -= 1;
    }

    if (r < 0 || r >= rows.length || c < 0 || c >= classDays.length) return null;
    const eid = rows[r]!.enrollmentId;
    const d = classDays[c]!;
    if (cellIsNavigable(cells, eid, d)) return { enrollmentId: eid, dateIso: d };
  }
  return null;
}

export function defaultMatrixFocus(
  rows: TeacherAttendanceMatrixPayload["rows"],
  classDays: string[],
  cells: TeacherAttendanceMatrixPayload["cells"],
  todayIso: string,
): { enrollmentId: string; dateIso: string } | null {
  const order = buildNavOrderedCells(rows, classDays, cells);
  if (order.length === 0) return null;
  if (classDays.includes(todayIso)) {
    const onToday = order.find((x) => x.dateIso === todayIso);
    if (onToday) return onToday;
  }
  const onOrBefore = classDays.filter((d) => d <= todayIso);
  for (let i = onOrBefore.length - 1; i >= 0; i--) {
    const d = onOrBefore[i]!;
    const hit = order.find((x) => x.dateIso === d);
    if (hit) return hit;
  }
  return order[0] ?? null;
}

export function firstMatrixCellInColumn(
  rows: TeacherAttendanceMatrixPayload["rows"],
  cells: TeacherAttendanceMatrixPayload["cells"],
  dateIso: string,
): { enrollmentId: string; dateIso: string } | null {
  for (const r of rows) {
    if (Object.prototype.hasOwnProperty.call(cells[r.enrollmentId] ?? {}, dateIso)) {
      return { enrollmentId: r.enrollmentId, dateIso };
    }
  }
  return null;
}
