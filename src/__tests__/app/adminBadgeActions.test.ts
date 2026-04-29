/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dictEn } from "@/test/dictEn";

const { mockAssertAdmin, mockCreateAdmin, auditMock } = vi.hoisted(() => ({
  mockAssertAdmin: vi.fn(),
  mockCreateAdmin: vi.fn(),
  auditMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockCreateAdmin(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({
  auditAcademicAction: (input: unknown) => auditMock(input),
}));

import { createBadgeAction } from "@/app/[locale]/dashboard/admin/badges/createBadgeAction";
import {
  setBadgeActiveAction,
  updateBadgeAction,
} from "@/app/[locale]/dashboard/admin/badges/updateBadgeAction";

const ae = dictEn.actionErrors.admin;
const adminUser = { id: "11111111-1111-1111-1111-111111111111" };
const VALID_BADGE_ID = "22222222-2222-4222-8222-222222222222";

const validTranslations = {
  en: { title: "First task", description: "Mark a task complete." },
  es: { title: "Primera tarea", description: "Marcá una tarea como completada." },
};

beforeEach(() => {
  vi.clearAllMocks();
  auditMock.mockResolvedValue(undefined);
});

describe("createBadgeAction", () => {
  it("rejects empty payload (missing every required field)", async () => {
    const r = await createBadgeAction({ locale: "en" } as never);
    expect(r).toEqual({ ok: false, message: ae.invalidData });
  });

  it("rejects bad code shape", async () => {
    const r = await createBadgeAction({
      locale: "en",
      code: "BAD CODE!",
      category: "tasks",
      criteriaType: "tasks_completed",
      criteriaThreshold: 1,
      sortOrder: 100,
      translations: validTranslations,
    } as never);
    expect(r).toEqual({ ok: false, message: ae.invalidData });
  });

  it("returns forbidden when assertAdmin throws", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("x"));
    const r = await createBadgeAction({
      locale: "en",
      code: "task1",
      category: "tasks",
      criteriaType: "tasks_completed",
      criteriaThreshold: 1,
      sortOrder: 100,
      translations: validTranslations,
    });
    expect(r).toEqual({ ok: false, message: ae.forbidden });
  });

  it("rolls back the catalog row when translations fail", async () => {
    mockAssertAdmin.mockResolvedValue({ user: adminUser });
    const insertSelect = vi.fn().mockResolvedValue({
      data: { id: VALID_BADGE_ID },
      error: null,
    });
    const insertChain = {
      select: vi.fn(() => ({ single: insertSelect })),
    };
    const insert = vi.fn().mockReturnValue(insertChain);
    const upsert = vi.fn().mockResolvedValue({ error: { message: "translations failed" } });
    const eqDelete = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq: eqDelete });
    mockCreateAdmin.mockReturnValue({
      from: (table: string) => {
        if (table === "badge_catalog") return { insert, delete: del };
        if (table === "badge_translations") return { upsert };
        throw new Error(`unexpected ${table}`);
      },
    });
    const r = await createBadgeAction({
      locale: "en",
      code: "task1",
      category: "tasks",
      criteriaType: "tasks_completed",
      criteriaThreshold: 1,
      sortOrder: 100,
      translations: validTranslations,
    });
    expect(r).toEqual({ ok: false, message: ae.saveFailed });
    expect(del).toHaveBeenCalled();
    expect(eqDelete).toHaveBeenCalledWith("id", VALID_BADGE_ID);
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("returns ok and emits audit on success", async () => {
    mockAssertAdmin.mockResolvedValue({ user: adminUser });
    const insertSelect = vi.fn().mockResolvedValue({
      data: { id: VALID_BADGE_ID },
      error: null,
    });
    const insert = vi.fn().mockReturnValue({
      select: vi.fn(() => ({ single: insertSelect })),
    });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mockCreateAdmin.mockReturnValue({
      from: (table: string) => {
        if (table === "badge_catalog") return { insert };
        if (table === "badge_translations") return { upsert };
        throw new Error(`unexpected ${table}`);
      },
    });
    const r = await createBadgeAction({
      locale: "en",
      code: "task1",
      category: "tasks",
      criteriaType: "tasks_completed",
      criteriaThreshold: 1,
      sortOrder: 100,
      translations: validTranslations,
    });
    expect(r).toEqual({ ok: true, badgeId: VALID_BADGE_ID });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ code: "task1", criteria_type: "tasks_completed" }),
    );
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        resourceType: "badge_catalog",
        resourceId: VALID_BADGE_ID,
      }),
    );
  });
});

describe("setBadgeActiveAction", () => {
  it("rejects invalid uuid", async () => {
    const r = await setBadgeActiveAction({ locale: "en", badgeId: "not-uuid", isActive: false });
    expect(r).toEqual({ ok: false, message: ae.invalidData });
  });

  it("audits with action=archive when pausing", async () => {
    mockAssertAdmin.mockResolvedValue({ user: adminUser });
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: VALID_BADGE_ID, code: "x", is_active: true }, error: null });
    const eqUpdate = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: eqUpdate });
    const select = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) });
    mockCreateAdmin.mockReturnValue({ from: () => ({ select, update }) });
    const r = await setBadgeActiveAction({ locale: "en", badgeId: VALID_BADGE_ID, isActive: false });
    expect(r).toEqual({ ok: true, badgeId: VALID_BADGE_ID });
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "archive",
        resourceType: "badge_catalog",
        beforeValues: { is_active: true },
        afterValues: { is_active: false },
      }),
    );
  });
});

describe("updateBadgeAction", () => {
  it("rejects invalid badgeId uuid", async () => {
    const r = await updateBadgeAction({
      locale: "en",
      badgeId: "bad",
      category: "tasks",
      criteriaType: "tasks_completed",
      criteriaThreshold: 1,
      sortOrder: 100,
      translations: validTranslations,
    });
    expect(r).toEqual({ ok: false, message: ae.invalidData });
  });

  it("emits update audit including before/after values", async () => {
    mockAssertAdmin.mockResolvedValue({ user: adminUser });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: VALID_BADGE_ID,
        code: "task1",
        category: "tasks",
        criteria_type: "tasks_completed",
        criteria_threshold: 1,
        sort_order: 100,
      },
      error: null,
    });
    const eqUpdate = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: eqUpdate });
    const select = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mockCreateAdmin.mockReturnValue({
      from: (table: string) => {
        if (table === "badge_catalog") return { select, update };
        if (table === "badge_translations") return { upsert };
        throw new Error(`unexpected ${table}`);
      },
    });
    const r = await updateBadgeAction({
      locale: "en",
      badgeId: VALID_BADGE_ID,
      category: "tasks",
      criteriaType: "tasks_completed",
      criteriaThreshold: 5,
      sortOrder: 50,
      translations: validTranslations,
    });
    expect(r).toEqual({ ok: true, badgeId: VALID_BADGE_ID });
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        beforeValues: expect.objectContaining({ criteria_threshold: 1 }),
        afterValues: expect.objectContaining({ criteria_threshold: 5, sort_order: 50 }),
      }),
    );
  });
});
