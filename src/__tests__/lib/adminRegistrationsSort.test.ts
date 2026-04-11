import { describe, it, expect } from "vitest";
import {
  filterRegistrationRows,
  sortRegistrationRows,
} from "@/lib/dashboard/adminRegistrationsSort";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

const base = (over: Partial<AdminRegistrationRow> = {}): AdminRegistrationRow => ({
  id: "1",
  first_name: "Ana",
  last_name: "López",
  dni: "123",
  email: "ana@x.co",
  phone: "+34",
  birth_date: "2000-06-15",
  level_interest: "B1",
  status: "new",
  created_at: "2026-01-02T00:00:00.000Z",
  ...over,
});

describe("filterRegistrationRows", () => {
  it("returns all rows when query is empty", () => {
    const rows = [base()];
    expect(filterRegistrationRows(rows, "   ")).toBe(rows);
  });

  it("filters by substring across fields", () => {
    const rows = [
      base({ id: "1", email: "findme@x.co" }),
      base({ id: "2", email: "other@y.co" }),
    ];
    expect(filterRegistrationRows(rows, "findme")).toHaveLength(1);
  });
});

describe("sortRegistrationRows", () => {
  const a = base({ id: "a", first_name: "A", last_name: "A", dni: "2", email: "b@x.co" });
  const b = base({ id: "b", first_name: "Z", last_name: "Z", dni: "1", email: "a@x.co" });

  it("sorts by name", () => {
    expect(sortRegistrationRows([b, a], "name", "asc")[0]?.id).toBe("a");
  });

  it("sorts by dni", () => {
    expect(sortRegistrationRows([a, b], "dni", "asc")[0]?.dni).toBe("1");
  });

  it("sorts by email", () => {
    expect(sortRegistrationRows([b, a], "email", "asc")[0]?.email).toBe("a@x.co");
  });

  it("sorts by level", () => {
    const x = base({ id: "x", level_interest: "A1" });
    const y = base({ id: "y", level_interest: "B2" });
    expect(sortRegistrationRows([y, x], "level", "asc")[0]?.id).toBe("x");
  });

  it("sorts by birth", () => {
    const early = base({ id: "e", birth_date: "1990-01-01" });
    const late = base({ id: "l", birth_date: "2010-01-01" });
    expect(sortRegistrationRows([late, early], "birth", "asc")[0]?.id).toBe("e");
  });

  it("sorts by status", () => {
    const n = base({ id: "n", status: "new" });
    const e = base({ id: "e", status: "enrolled" });
    expect(sortRegistrationRows([e, n], "status", "asc")[0]?.status).toBe("enrolled");
  });

  it("sorts by received", () => {
    const old = base({ id: "o", created_at: "2020-01-01T00:00:00.000Z" });
    const neu = base({ id: "n", created_at: "2026-01-01T00:00:00.000Z" });
    expect(sortRegistrationRows([neu, old], "received", "desc")[0]?.id).toBe("n");
  });

  it("uses default branch when key does not match cases", () => {
    const rows = [a, b];
    const out = sortRegistrationRows(
      rows,
      "notARealKey" as unknown as import("@/lib/dashboard/adminRegistrationsSort").RegistrationSortKey,
      "asc",
    );
    expect(out).toHaveLength(2);
  });
});
