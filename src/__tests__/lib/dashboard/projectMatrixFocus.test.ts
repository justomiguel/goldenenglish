// REGRESSION CHECK: Focusing a matrix must not drop the other axis.
import { describe, expect, it } from "vitest";
import {
  defaultFocusColumnId,
  focusMatrixColumn,
  focusMatrixRow,
} from "@/lib/dashboard/projectMatrixFocus";

const rows = [
  { id: "a", name: "Ada" },
  { id: "b", name: "Bea" },
];
const columns = ["2026-10-01", "2026-10-08"];

describe("projectMatrixFocus", () => {
  it("returns one student and every column", () => {
    const focused = focusMatrixRow(rows, columns, "b", (row) => row.id);
    expect(focused?.row.name).toBe("Bea");
    expect(focused?.columns).toEqual(columns);
  });

  it("returns one day and every student", () => {
    const focused = focusMatrixColumn(rows, columns, "2026-10-01", (column) => column);
    expect(focused?.column).toBe("2026-10-01");
    expect(focused?.rows).toHaveLength(2);
  });

  it("returns null when the id is missing", () => {
    expect(focusMatrixRow(rows, columns, "missing", (row) => row.id)).toBeNull();
  });

  it("picks today, otherwise the latest past column", () => {
    expect(defaultFocusColumnId(columns, "2026-10-08")).toBe("2026-10-08");
    expect(defaultFocusColumnId(columns, "2026-10-10")).toBe("2026-10-08");
    expect(defaultFocusColumnId([], "2026-10-08")).toBeNull();
  });
});
