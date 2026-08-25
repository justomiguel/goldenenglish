import { describe, expect, it, vi } from "vitest";

const getDashboardActor = vi.fn();

vi.mock("@/lib/dashboard/getDashboardActor", () => ({
  getDashboardActor: () => getDashboardActor(),
}));

import { assertNotViewAs } from "@/lib/dashboard/assertNotViewAs";

describe("assertNotViewAs", () => {
  it("allows writes when view-as is unset", async () => {
    getDashboardActor.mockResolvedValue({ viewAs: null });
    expect(await assertNotViewAs()).toEqual({ ok: true });
  });

  it("blocks writes when view-as is set", async () => {
    getDashboardActor.mockResolvedValue({
      viewAs: { id: "stu-1", displayName: "Ana", role: "student" },
    });
    expect(await assertNotViewAs()).toEqual({ ok: false, code: "view_as_read_only" });
  });
});
