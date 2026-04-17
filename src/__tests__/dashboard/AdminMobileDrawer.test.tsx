import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { AdminMobileDrawer } from "@/components/dashboard/AdminMobileDrawer";

describe("AdminMobileDrawer", () => {
  const mqListeners: Array<(e: Event) => void> = [];
  let matches = false;

  beforeEach(() => {
    mqListeners.length = 0;
    matches = false;
    vi.spyOn(window, "matchMedia").mockImplementation(() => {
      const list = {
        get matches() {
          return matches;
        },
        media: "(min-width: 768px)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_: string, cb: EventListener) => {
          mqListeners.push(cb as (e: Event) => void);
        },
        removeEventListener: (_: string, cb: EventListener) => {
          const i = mqListeners.indexOf(cb as (e: Event) => void);
          if (i !== -1) mqListeners.splice(i, 1);
        },
        dispatchEvent: vi.fn(),
      };
      return list as unknown as MediaQueryList;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  it("closes and unlocks body when viewport crosses md while open", async () => {
    const user = userEvent.setup();
    render(
      <AdminMobileDrawer locale="es" dict={dictEn} newRegistrationsCount={0} />,
    );

    await user.click(screen.getByRole("button", { name: dictEn.dashboard.adminNav.mobileOpen }));
    expect(document.body.style.overflow).toBe("hidden");

    matches = true;
    await act(async () => {
      for (const cb of mqListeners) {
        cb(new Event("change"));
      }
    });

    expect(document.body.style.overflow).toBe("");
    expect(screen.queryByRole("dialog", { name: dictEn.dashboard.adminNav.aria })).toBeNull();
  });
});
