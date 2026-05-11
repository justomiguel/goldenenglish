import { describe, it, expect } from "vitest";
import { buildAdminDeletionAddedStudentPreviewRows } from "@/lib/dashboard/buildAdminDeletionAddedStudentPreviewRows";

describe("buildAdminDeletionAddedStudentPreviewRows", () => {
  it("sorts by last name then first and formats surname first", () => {
    const rows = buildAdminDeletionAddedStudentPreviewRows(
      ["b", "a"],
      [
        { id: "a", first_name: "Ana", last_name: "Zeta" },
        { id: "b", first_name: "Bea", last_name: "Alfa" },
      ],
    );
    expect(rows.map((r) => r.label)).toEqual(["Alfa Bea", "Zeta Ana"]);
  });

  it("uses id as fallback when profile missing", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const rows = buildAdminDeletionAddedStudentPreviewRows([id], []);
    expect(rows).toEqual([{ id, label: id }]);
  });
});
