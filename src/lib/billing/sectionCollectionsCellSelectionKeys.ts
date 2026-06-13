export type CellKey = `${string}:${number}`;

export function cellKey(studentId: string, month: number): CellKey {
  return `${studentId}:${month}`;
}

export function parseCellKey(key: CellKey): { studentId: string; month: number } {
  const [studentId, monthStr] = key.split(":");
  return { studentId: studentId!, month: Number(monthStr) };
}

export function groupSelectedCellsByStudent(selectedCells: Set<CellKey>): Map<string, number[]> {
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
}
