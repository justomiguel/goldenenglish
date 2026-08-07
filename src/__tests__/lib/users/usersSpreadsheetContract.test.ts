import { describe, expect, it } from "vitest";
import {
  USERS_SPREADSHEET_COLUMNS,
  USERS_SPREADSHEET_REQUIRED_COLUMNS,
  assertUsersSpreadsheetHeaders,
} from "@/lib/users/usersSpreadsheetColumns";
import {
  usersSpreadsheetRowSchema,
  parseUsersSpreadsheetRawRows,
} from "@/lib/users/usersSpreadsheetRowSchema";

// REGRESSION CHECK: Export→import round-trip depends on these exact English header keys.
describe("usersSpreadsheetColumns", () => {
  it("exposes stable English headers in export order", () => {
    expect(USERS_SPREADSHEET_COLUMNS).toEqual([
      "email",
      "role",
      "first_name",
      "last_name",
      "dni_or_passport",
      "phone",
      "birth_date",
    ]);
  });

  it("requires email, role, first_name, last_name", () => {
    expect([...USERS_SPREADSHEET_REQUIRED_COLUMNS].sort()).toEqual([
      "email",
      "first_name",
      "last_name",
      "role",
    ]);
  });

  it("accepts headers that include all required columns (extras ok)", () => {
    expect(
      assertUsersSpreadsheetHeaders(["email", "role", "first_name", "last_name", "extra"]),
    ).toEqual({ ok: true });
  });

  it("rejects when a required header is missing", () => {
    expect(assertUsersSpreadsheetHeaders(["email", "first_name", "last_name"])).toEqual({
      ok: false,
      code: "missing_headers",
      missing: ["role"],
    });
  });
});

describe("usersSpreadsheetRowSchema", () => {
  it("parses a valid multi-role row", () => {
    const row = usersSpreadsheetRowSchema.parse({
      email: " teacher@school.test ",
      role: "teacher",
      first_name: "Ada",
      last_name: "Lovelace",
      dni_or_passport: "30111222",
      phone: "",
      birth_date: "1990-01-15",
    });
    expect(row).toEqual({
      email: "teacher@school.test",
      role: "teacher",
      first_name: "Ada",
      last_name: "Lovelace",
      dni_or_passport: "30111222",
      phone: null,
      birth_date: "1990-01-15",
    });
  });

  it("rejects invalid role", () => {
    expect(
      usersSpreadsheetRowSchema.safeParse({
        email: "a@b.co",
        role: "guest",
        first_name: "A",
        last_name: "B",
      }).success,
    ).toBe(false);
  });

  it("parseUsersSpreadsheetRawRows splits valid and invalid", () => {
    const { valid, invalid } = parseUsersSpreadsheetRawRows([
      {
        email: "ok@x.com",
        role: "student",
        first_name: "Ok",
        last_name: "User",
      },
      { email: "bad", role: "student", first_name: "X", last_name: "Y" },
    ]);
    expect(valid).toHaveLength(1);
    expect(valid[0]?.email).toBe("ok@x.com");
    expect(invalid).toHaveLength(1);
    expect(invalid[0]?.rowIndex).toBe(1);
  });
});
