// REGRESSION CHECK: Layout settle must run before Driver refresh after SPA remounts.
// Scroll-into-view must finish (instant) before refresh so the popover is not mid-scroll.
import { describe, expect, it, vi } from "vitest";
import {
  bindTourLayoutSync,
  scrollTourTargetIntoView,
  tourScrollBehavior,
  waitForLayoutSettle,
} from "@/lib/admin-tutorials/client/tourLayoutSync";

describe("waitForLayoutSettle", () => {
  it("resolves after animation frames and delay", async () => {
    await expect(waitForLayoutSettle(0)).resolves.toBeUndefined();
  });
});

describe("tourScrollBehavior", () => {
  it("returns auto (instant) to avoid mid-scroll popover placement", () => {
    expect(tourScrollBehavior()).toBe("auto");
  });
});

describe("scrollTourTargetIntoView", () => {
  it("scrolls HTMLElement into view with center block", () => {
    const el = document.createElement("div");
    const scrollIntoView = vi.fn();
    el.scrollIntoView = scrollIntoView;
    document.body.appendChild(el);
    scrollTourTargetIntoView(el);
    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: "center", inline: "nearest", behavior: "auto" }),
    );
    el.remove();
  });

  it("does not throw when given body", () => {
    expect(() => scrollTourTargetIntoView(document.body)).not.toThrow();
  });
});

describe("bindTourLayoutSync", () => {
  it("calls refresh and disposes listeners", () => {
    const refresh = vi.fn();
    const api = {
      isActive: () => true,
      refresh,
      getActiveElement: () => document.body,
      getActiveStep: () => undefined,
    };
    const sync = bindTourLayoutSync(api);
    sync.refreshNow();
    expect(refresh).toHaveBeenCalled();
    sync.dispose();
    refresh.mockClear();
    sync.refreshNow();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("alignToActiveElement scrolls target then refreshes", async () => {
    const refresh = vi.fn();
    const el = document.createElement("button");
    const scrollIntoView = vi.fn();
    el.scrollIntoView = scrollIntoView;
    document.body.appendChild(el);

    const sync = bindTourLayoutSync({
      isActive: () => true,
      refresh,
      getActiveElement: () => el,
      getActiveStep: () => undefined,
    });

    await sync.alignToActiveElement();
    expect(scrollIntoView).toHaveBeenCalled();
    expect(refresh.mock.calls.length).toBeGreaterThanOrEqual(1);
    sync.dispose();
    el.remove();
  });
});
