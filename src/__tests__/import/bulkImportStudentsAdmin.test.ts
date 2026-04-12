import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { bulkImportStudentsFromRowsAdmin } from "@/lib/import/bulkImportStudents";
import type { CsvStudentRow } from "@/lib/import/studentRowSchema";
import {
  IMPORT_ROW_AUTH_ERROR,
  IMPORT_ROW_ENROLLMENT_FAILED,
  IMPORT_ROW_NO_USER_ID,
  IMPORT_ROW_UNKNOWN,
} from "@/lib/import/importResultMessageCodes";

function baseRow(over: Partial<CsvStudentRow> = {}): CsvStudentRow {
  return {
    first_name: "Ada",
    last_name: "Lovelace",
    dni_or_passport: "100",
    ...over,
  };
}

function profileSingleOk(id: string, dni: string) {
  return {
    data: {
      id,
      role: "student" as const,
      phone: null as string | null,
      birth_date: null as string | null,
      dni_or_passport: dni,
    },
    error: null,
  };
}

const listUsersEmpty = vi.fn().mockResolvedValue({
  data: { users: [] },
  error: null,
});

describe("bulkImportStudentsFromRowsAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listUsersEmpty.mockResolvedValue({ data: { users: [] }, error: null });
  });

  it("returns auth error when student createUser fails", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "duplicate" },
    });
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          let dni = "";
          return {
            select: vi.fn().mockReturnThis(),
            eq(f: string, v: string) {
              if (f === "dni_or_passport") dni = v;
              return this;
            },
            maybeSingle: vi.fn(async () =>
              dni === "100" ? { data: null, error: null } : { data: null, error: null },
            ),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [baseRow()]);
    expect(r.results[0]).toMatchObject({ ok: false, message: IMPORT_ROW_AUTH_ERROR });
    expect(r.createdUsers).toBe(0);
  });

  it("flags No user id when createUser returns no user without error", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(async () => ({ data: null, error: null })),
      })),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [baseRow()]);
    expect(r.results[0]).toMatchObject({ ok: false, message: IMPORT_ROW_NO_USER_ID });
  });

  it("reuses existing student profile and still seeds payments", async () => {
    const createUser = vi.fn();
    const insertPayment = vi.fn().mockResolvedValue({ error: null });
    let paymentsMode: "read" | "write" = "read";

    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          let dni = "";
          return {
            select: vi.fn().mockReturnThis(),
            eq(f: string, v: string) {
              if (f === "dni_or_passport") dni = v;
              return this;
            },
            maybeSingle: vi.fn(async () => {
              if (dni === "100") {
                return {
                  data: { id: "existing-stu", role: "student" },
                  error: null,
                };
              }
              return { data: null, error: null };
            }),
            single: vi.fn(async () => profileSingleOk("existing-stu", "100")),
          };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            let studentId = "";
            return {
              select: vi.fn().mockReturnThis(),
              eq(f: string, v: string) {
                if (f === "student_id") studentId = v;
                return this;
              },
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () =>
                studentId === "existing-stu"
                  ? { data: null, error: null }
                  : { data: null, error: null },
              ),
            };
          }
          return {
            insert: insertPayment,
          };
        }
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({ dni_or_passport: "100", monthly_fee: 10 }),
    ]);
    expect(createUser).not.toHaveBeenCalled();
    expect(r.paymentsSeeded).toBe(12);
    expect(r.results[0]?.ok).toBe(true);
  });

  it("skips enrollment when level missing", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "new" } },
      error: null,
    });
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            single: vi.fn(async () => profileSingleOk("new", "100")),
          };
        }
        if (table === "payments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [baseRow()]);
    expect(r.enrolled).toBe(0);
    expect(r.results[0]?.ok).toBe(true);
  });

  it("fails row on non-duplicate enrollment error", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "stu" } },
      error: null,
    });
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "courses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({
              data: { id: "c1" },
              error: null,
            })),
          };
        }
        if (table === "enrollments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            insert: vi.fn(async () => ({
              error: { code: "ERR", message: "nope" },
            })),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          insert: vi.fn().mockResolvedValue({ error: null }),
          upsert: vi.fn(),
        };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({ level: "B1" }),
    ]);
    expect(r.results[0]).toMatchObject({ ok: false, message: IMPORT_ROW_ENROLLMENT_FAILED });
  });

  it("ignores duplicate enrollment constraint", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "stu" } },
      error: null,
    });
    let paymentsMode: "read" | "write" = "read";
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "courses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({
              data: { id: "c1" },
              error: null,
            })),
          };
        }
        if (table === "enrollments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            insert: vi.fn(async () => ({
              error: { code: "23505", message: "dup" },
            })),
          };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({ level: "A1" }),
    ]);
    expect(r.results[0]?.ok).toBe(true);
    expect(r.enrolled).toBe(0);
  });

  it("uses fee 0 when monthly_fee is NaN", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "stu" } },
      error: null,
    });
    let paymentsMode: "read" | "write" = "read";
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({
        monthly_fee: Number.NaN as unknown as number,
      }),
    ]);
    expect(r.paymentsSeeded).toBe(12);
    expect(r.results[0]?.ok).toBe(true);
  });

  it("does not seed payments when payments already exist for 2026", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "stu" } },
      error: null,
    });
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "payments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: { id: "p" }, error: null })),
            insert: vi.fn(),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [baseRow()]);
    expect(r.paymentsSeeded).toBe(0);
    expect(r.results[0]?.ok).toBe(true);
  });

  it("returns null parent when tutor document maps to student role", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "stu" } },
      error: null,
    });
    let paymentsMode: "read" | "write" = "read";
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          let dni = "";
          return {
            select: vi.fn().mockReturnThis(),
            eq(f: string, v: string) {
              if (f === "dni_or_passport") dni = v;
              return this;
            },
            maybeSingle: vi.fn(async () => {
              if (dni === "200") {
                return {
                  data: { id: "tutor-prof", role: "student" },
                  error: null,
                };
              }
              return { data: null, error: null };
            }),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({ tutor_dni: "200" }),
    ]);
    expect(r.results[0]?.ok).toBe(true);
  });

  it("returns existing parent id when tutor is already parent", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "stu" } },
      error: null,
    });
    let paymentsMode: "read" | "write" = "read";
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          let dni = "";
          return {
            select: vi.fn().mockReturnThis(),
            eq(f: string, v: string) {
              if (f === "dni_or_passport") dni = v;
              return this;
            },
            maybeSingle: vi.fn(async () => {
              if (dni === "300") {
                return { data: { id: "par", role: "parent" }, error: null };
              }
              return { data: null, error: null };
            }),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "tutor_student_rel") {
          return { upsert: vi.fn().mockResolvedValue({ error: null }) };
        }
        throw new Error(`unexpected ${table}`);
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({ tutor_dni: "300" }),
    ]);
    expect(r.results[0]?.ok).toBe(true);
  });

  it("proceeds when parent createUser fails (no parent link)", async () => {
    let studentCreated = false;
    const createUser = vi.fn(async () => {
      if (!studentCreated) {
        studentCreated = true;
        return { data: { user: { id: "stu" } }, error: null };
      }
      return { data: { user: null }, error: { message: "bad" } };
    });
    let paymentsMode: "read" | "write" = "read";
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          let dni = "";
          return {
            select: vi.fn().mockReturnThis(),
            eq(f: string, v: string) {
              if (f === "dni_or_passport") dni = v;
              return this;
            },
            maybeSingle: vi.fn(async () => {
              if (dni === "400") return { data: null, error: null };
              return { data: null, error: null };
            }),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({ tutor_dni: "400", tutor_first_name: "T" }),
    ]);
    expect(r.results[0]?.ok).toBe(true);
  });

  it("handles non-Error in catch as unknown row code", async () => {
    const boom = vi.fn().mockRejectedValue("x");
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(boom),
      })),
      auth: { admin: { createUser: vi.fn(), listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [baseRow()]);
    expect(r.results[0]).toMatchObject({ ok: false, message: IMPORT_ROW_UNKNOWN });
  });

  it("creates parent user and links when tutor document is new", async () => {
    const createUser = vi
      .fn()
      .mockResolvedValueOnce({
        data: { user: { id: "stu-new" } },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { user: { id: "par-new" } },
        error: null,
      });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    let paymentsMode: "read" | "write" = "read";

    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          let dni = "";
          return {
            select: vi.fn().mockReturnThis(),
            eq(f: string, v: string) {
              if (f === "dni_or_passport") dni = v;
              return this;
            },
            maybeSingle: vi.fn(async () => {
              if (dni === "100" || dni === "600") {
                return { data: null, error: null };
              }
              return { data: null, error: null };
            }),
            single: vi.fn(async () => profileSingleOk("stu-new", "100")),
          };
        }
        if (table === "tutor_student_rel") {
          return { upsert };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({
        dni_or_passport: "100",
        tutor_dni: "600",
        tutor_first_name: "Pat",
        tutor_last_name: "Lee",
      }),
    ]);

    expect(createUser).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenCalled();
    expect(r.results[0]?.ok).toBe(true);
  });

  it("treats duplicate enrollment by message as non-fatal", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "stu" } },
      error: null,
    });
    let paymentsMode: "read" | "write" = "read";
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "courses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({
              data: { id: "c1" },
              error: null,
            })),
          };
        }
        if (table === "enrollments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            insert: vi.fn(async () => ({
              error: { message: "duplicate key something" },
            })),
          };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({ level: "A2" }),
    ]);
    expect(r.results[0]?.ok).toBe(true);
  });

  it("resolves no course when level set but course query returns null", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "stu" } },
      error: null,
    });
    let paymentsMode: "read" | "write" = "read";
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "courses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({ level: "C1" }),
    ]);
    expect(r.enrolled).toBe(0);
    expect(r.results[0]?.ok).toBe(true);
  });

  it("increments enrolled when enrollment insert succeeds", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "stu" } },
      error: null,
    });
    let paymentsMode: "read" | "write" = "read";
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "courses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({
              data: { id: "c-enroll-ok" },
              error: null,
            })),
          };
        }
        if (table === "enrollments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            insert: vi.fn(async () => ({ error: null })),
          };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({ level: "B1" }),
    ]);
    expect(r.enrolled).toBe(1);
    expect(r.results[0]?.ok).toBe(true);
  });

  it("skips course when courses query returns an error", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "stu" } },
      error: null,
    });
    let paymentsMode: "read" | "write" = "read";
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "courses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({
              data: null,
              error: { message: "rls" },
            })),
          };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({ level: "A1" }),
    ]);
    expect(r.enrolled).toBe(0);
    expect(r.results[0]?.ok).toBe(true);
  });

  it("links tutor when tutor profile role is admin", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "stu" } },
      error: null,
    });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    let paymentsMode: "read" | "write" = "read";

    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          let dni = "";
          return {
            select: vi.fn().mockReturnThis(),
            eq(f: string, v: string) {
              if (f === "dni_or_passport") dni = v;
              return this;
            },
            maybeSingle: vi.fn(async () => {
              if (dni === "100") {
                return { data: null, error: null };
              }
              if (dni === "777") {
                return {
                  data: { id: "admin-tutor", role: "admin" },
                  error: null,
                };
              }
              return { data: null, error: null };
            }),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "tutor_student_rel") {
          return { upsert };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({ tutor_dni: "777" }),
    ]);
    expect(upsert).toHaveBeenCalled();
    expect(r.results[0]?.ok).toBe(true);
  });

  it("records Error message from catch block", async () => {
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(async () => {
          throw new Error("profile lookup failed");
        }),
      })),
      auth: { admin: { createUser: vi.fn(), listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [baseRow()]);
    expect(r.results[0]).toMatchObject({
      ok: false,
      message: IMPORT_ROW_UNKNOWN,
    });
  });

  it("counts only successful payment inserts when some months fail", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "stu" } },
      error: null,
    });
    let paymentsMode: "read" | "write" = "read";
    let insertN = 0;
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            };
          }
          return {
            insert: vi.fn(async () => {
              insertN += 1;
              return insertN === 1
                ? { error: { message: "once" } }
                : { error: null };
            }),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [baseRow()]);
    expect(r.paymentsSeeded).toBe(11);
    expect(r.results[0]?.ok).toBe(true);
  });

  it("uses explicit student email and tutor contact fields", async () => {
    const createUser = vi
      .fn()
      .mockResolvedValueOnce({
        data: { user: { id: "stu" } },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { user: { id: "par" } },
        error: null,
      });
    let paymentsMode: "read" | "write" = "read";
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          let dni = "";
          return {
            select: vi.fn().mockReturnThis(),
            eq(f: string, v: string) {
              if (f === "dni_or_passport") dni = v;
              return this;
            },
            maybeSingle: vi.fn(async () => {
              if (dni === "100" || dni === "888") {
                return { data: null, error: null };
              }
              return { data: null, error: null };
            }),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "tutor_student_rel") {
          return { upsert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({
        dni_or_passport: "100",
        email: "alumno@escuela.test",
        tutor_dni: "888",
        tutor_email: "tutor@escuela.test",
        tutor_phone: "+54 11 0000",
        tutor_first_name: "T",
        tutor_last_name: "U",
      }),
    ]);

    expect(createUser).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ email: "alumno@escuela.test" }),
    );
    expect(createUser).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ email: "tutor@escuela.test" }),
    );
  });

  it("treats enrollment error without duplicate hint as fatal", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "stu" } },
      error: null,
    });
    let paymentsMode: "read" | "write" = "read";
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            single: vi.fn(async () => profileSingleOk("stu", "100")),
          };
        }
        if (table === "courses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({
              data: { id: "c1" },
              error: null,
            })),
          };
        }
        if (table === "enrollments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            insert: vi.fn(async () => ({
              error: { code: "42703" },
            })),
          };
        }
        if (table === "payments") {
          if (paymentsMode === "read") {
            paymentsMode = "write";
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { upsert: vi.fn() };
      }),
      auth: { admin: { createUser, listUsers: listUsersEmpty } },
    } as unknown as SupabaseClient;

    const r = await bulkImportStudentsFromRowsAdmin(admin, [
      baseRow({ level: "A1" }),
    ]);
    expect(r.results[0]?.ok).toBe(false);
  });
});
