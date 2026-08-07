import { describe, expect, it } from "vitest";
import { classifyUsersSpreadsheetRows } from "@/lib/users/classifyUsersSpreadsheetRows";
import type { UsersSpreadsheetRow } from "@/lib/users/usersSpreadsheetRowSchema";

// REGRESSION CHECK: Duplicate detection must match email OR dni; never treat missing dni as a match.
function row(partial: Partial<UsersSpreadsheetRow> & Pick<UsersSpreadsheetRow, "email" | "role" | "first_name" | "last_name">): UsersSpreadsheetRow {
  return {
    dni_or_passport: null,
    phone: null,
    birth_date: null,
    ...partial,
  };
}

describe("classifyUsersSpreadsheetRows", () => {
  const existing = [
    { id: "u1", email: "ada@school.test", dni_or_passport: "111" },
    { id: "u2", email: "bob@school.test", dni_or_passport: null },
  ];

  it("marks rows as new when email and dni are unused", () => {
    const result = classifyUsersSpreadsheetRows(
      [row({ email: "new@school.test", role: "teacher", first_name: "N", last_name: "W", dni_or_passport: "999" })],
      existing,
    );
    expect(result.newRows).toHaveLength(1);
    expect(result.duplicateRows).toHaveLength(0);
  });

  it("marks duplicate by email (case-insensitive)", () => {
    const result = classifyUsersSpreadsheetRows(
      [row({ email: "ADA@school.test", role: "admin", first_name: "Ada", last_name: "L" })],
      existing,
    );
    expect(result.duplicateRows).toHaveLength(1);
    expect(result.duplicateRows[0]?.existingId).toBe("u1");
    expect(result.newRows).toHaveLength(0);
  });

  it("marks duplicate by dni when email is new", () => {
    const result = classifyUsersSpreadsheetRows(
      [
        row({
          email: "other@school.test",
          role: "student",
          first_name: "A",
          last_name: "B",
          dni_or_passport: "111",
        }),
      ],
      existing,
    );
    expect(result.duplicateRows[0]?.existingId).toBe("u1");
  });

  it("does not match empty dni against other empty dni", () => {
    const result = classifyUsersSpreadsheetRows(
      [row({ email: "fresh@school.test", role: "parent", first_name: "P", last_name: "Q" })],
      existing,
    );
    expect(result.newRows).toHaveLength(1);
  });
});
