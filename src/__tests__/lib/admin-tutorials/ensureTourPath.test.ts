import { describe, expect, it, vi, beforeEach } from "vitest";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

const waitForSelector = vi.fn();
const waitForLayoutSettle = vi.fn();
const logClientWarn = vi.fn();

vi.mock("@/lib/admin-tutorials/client/waitForSelector", () => ({
  waitForSelector: (...args: unknown[]) => waitForSelector(...args),
}));

vi.mock("@/lib/admin-tutorials/client/tourLayoutSync", () => ({
  waitForLayoutSettle: (...args: unknown[]) => waitForLayoutSettle(...args),
}));

vi.mock("@/lib/logging/clientLog", () => ({
  logClientWarn: (...args: unknown[]) => logClientWarn(...args),
}));

describe("ensureTourPath", () => {
  beforeEach(() => {
    waitForSelector.mockReset();
    waitForLayoutSettle.mockReset().mockResolvedValue(undefined);
    logClientWarn.mockReset();
  });

  it("pushes when off-path and returns true when selector appears", async () => {
    waitForSelector.mockResolvedValue(document.createElement("div"));
    const push = vi.fn();
    const { ensureTourPath } = await import("@/lib/admin-tutorials/client/ensureTourPath");
    const ok = await ensureTourPath({
      locale: "es",
      pathname: "/es/dashboard/admin",
      targetPath: "/es/dashboard/admin/events/new",
      alreadyOnPath: false,
      waitAnchor: ADMIN_TOUR_ANCHORS.eventCreateForm,
      push,
      scope: "test",
      reason: "missing",
    });
    expect(ok).toBe(true);
    expect(push).toHaveBeenCalledWith("/es/dashboard/admin/events/new");
    expect(waitForLayoutSettle).toHaveBeenCalled();
  });

  it("returns false and warns when selector never appears", async () => {
    waitForSelector.mockResolvedValue(null);
    const { ensureTourPath } = await import("@/lib/admin-tutorials/client/ensureTourPath");
    const ok = await ensureTourPath({
      locale: "es",
      pathname: "/es/dashboard/admin/events/new",
      targetPath: "/es/dashboard/admin/events/new",
      alreadyOnPath: true,
      waitAnchor: ADMIN_TOUR_ANCHORS.eventCreateForm,
      push: vi.fn(),
      scope: "test",
      reason: "missing",
    });
    expect(ok).toBe(false);
    expect(logClientWarn).toHaveBeenCalled();
  });
});
