/** @vitest-environment node */
// REGRESSION CHECK: A missing admin session on a page must redirect. It must not throw ADMIN_SESSION_UNAUTHORIZED.
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";

const mocks = vi.hoisted(() => ({
  assertAdmin: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mocks.assertAdmin(),
}));

import { requireAdminPage } from "@/lib/dashboard/requireAdminPage";

describe("requireAdminPage", () => {
  beforeEach(() => {
    mocks.assertAdmin.mockReset();
    mocks.redirect.mockClear();
  });

  it("sends a missing session to login", async () => {
    mocks.assertAdmin.mockRejectedValue(new Error(ADMIN_SESSION_UNAUTHORIZED));
    await expect(requireAdminPage("es")).rejects.toThrow(
      "REDIRECT:/es/login?next=/es/dashboard/admin",
    );
  });

  it("sends a signed-in non-admin to the locale home", async () => {
    mocks.assertAdmin.mockRejectedValue(new Error(ADMIN_SESSION_FORBIDDEN));
    await expect(requireAdminPage("es")).rejects.toThrow("REDIRECT:/es");
  });

  it("rethrows an unexpected error", async () => {
    mocks.assertAdmin.mockRejectedValue(new Error("db_down"));
    await expect(requireAdminPage("es")).rejects.toThrow("db_down");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("returns the admin session when the check passes", async () => {
    const session = { supabase: {}, user: { id: "admin-1" } };
    mocks.assertAdmin.mockResolvedValue(session);
    await expect(requireAdminPage("es")).resolves.toBe(session);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
