// REGRESSION CHECK: openNewCohortModalForTutorial activates tour session before open (stacked dialog).
import { beforeEach, describe, expect, it, vi } from "vitest";

const setAdminTourSessionActive = vi.fn();
const waitForSelector = vi.fn();
const waitForLayoutSettle = vi.fn(async () => {});

vi.mock("@/lib/admin-tutorials/client/adminTourSession", () => ({
  setAdminTourSessionActive: (...args: unknown[]) => setAdminTourSessionActive(...args),
}));

vi.mock("@/lib/admin-tutorials/client/waitForSelector", () => ({
  waitForSelector: (...args: unknown[]) => waitForSelector(...args),
}));

vi.mock("@/lib/admin-tutorials/client/tourLayoutSync", () => ({
  waitForLayoutSettle: (...args: unknown[]) => waitForLayoutSettle(...args),
}));

vi.mock("@/lib/logging/clientLog", () => ({
  logClientWarn: vi.fn(),
}));

describe("openNewCohortModalForTutorial", () => {
  beforeEach(() => {
    setAdminTourSessionActive.mockReset();
    waitForSelector.mockReset();
    waitForLayoutSettle.mockReset();
    waitForLayoutSettle.mockResolvedValue(undefined);
    document.body.innerHTML = "";
  });

  it("activates tour session before dispatching open event and requires stacked dialog", async () => {
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    // jsdom: not :modal when using setAttribute open (simulates show())
    const field = document.createElement("input");
    field.setAttribute("data-tour", "academic-new-cohort-name");
    dialog.appendChild(field);
    document.body.appendChild(dialog);

    waitForSelector.mockResolvedValue(field);

    const { openNewCohortModalForTutorial } = await import(
      "@/lib/admin-tutorials/client/prepareAdminTourStep"
    );

    const order: string[] = [];
    setAdminTourSessionActive.mockImplementation(() => {
      order.push("tour-active");
    });
    const dispatchSpy = vi.spyOn(window, "dispatchEvent").mockImplementation((ev) => {
      order.push((ev as CustomEvent).type);
      return true;
    });

    const ok = await openNewCohortModalForTutorial();

    expect(ok).toBe(true);
    expect(order[0]).toBe("tour-active");
    expect(order).toContain("ge:admin-tutorial:open-new-cohort");
    expect(order.indexOf("tour-active")).toBeLessThan(
      order.indexOf("ge:admin-tutorial:open-new-cohort"),
    );

    dispatchSpy.mockRestore();
  });
});
