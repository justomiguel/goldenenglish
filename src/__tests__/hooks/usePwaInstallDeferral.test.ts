/** @vitest-environment jsdom */
// The install sheet waits on pages that mark a hero with
// `data-pwa-install-defer`: it opens only after the hero is above the screen
// and no dialog is open. Pages without the mark are not affected.
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { usePwaInstallDeferral } from "@/hooks/usePwaInstallDeferral";

afterEach(() => {
  document.body.innerHTML = "";
});

function addHero(bottom: { current: number }) {
  const hero = document.createElement("section");
  hero.setAttribute("data-pwa-install-defer", "");
  hero.getBoundingClientRect = () => ({ bottom: bottom.current }) as DOMRect;
  document.body.appendChild(hero);
  return hero;
}

function scroll() {
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("usePwaInstallDeferral", () => {
  it("is ready at once when the page has no deferral mark", async () => {
    const { result } = renderHook(() => usePwaInstallDeferral());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toBe(true);
  });

  it("waits while the hero is on screen", () => {
    addHero({ current: 600 });
    const { result } = renderHook(() => usePwaInstallDeferral());
    scroll();
    expect(result.current).toBe(false);
  });

  it("opens after the hero leaves the top of the screen", () => {
    const bottom = { current: 600 };
    addHero(bottom);
    const { result } = renderHook(() => usePwaInstallDeferral());
    bottom.current = -10;
    scroll();
    expect(result.current).toBe(true);
  });

  it("follows a hero that hydration replaced after mount", () => {
    const first = addHero({ current: 600 });
    const { result } = renderHook(() => usePwaInstallDeferral());
    first.remove();
    addHero({ current: -50 });
    scroll();
    expect(result.current).toBe(true);
  });

  it("keeps waiting while a dialog is open, then opens on the next scroll", () => {
    addHero({ current: -10 });
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    document.body.appendChild(dialog);
    const { result } = renderHook(() => usePwaInstallDeferral());
    scroll();
    expect(result.current).toBe(false);
    dialog.removeAttribute("open");
    scroll();
    expect(result.current).toBe(true);
  });
});
