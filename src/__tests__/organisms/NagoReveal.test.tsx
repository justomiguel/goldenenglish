import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { NagoReveal } from "@/components/organisms/NagoReveal";

describe("NagoReveal", () => {
  it("marks the node as in-view when IntersectionObserver fires", async () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn((cb: IntersectionObserverCallback) => {
        queueMicrotask(() => {
          cb(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver,
          );
        });
        return { observe, disconnect, unobserve: vi.fn() };
      }),
    );

    const { container } = render(
      <NagoReveal>
        <p>Nagô</p>
      </NagoReveal>,
    );

    expect(container.firstElementChild).toHaveClass("nago-reveal");
    expect(observe).toHaveBeenCalled();
    await waitFor(() => {
      expect(container.firstElementChild).toHaveClass("is-in");
    });
  });

  it("renders as an article when asked", () => {
    const { container } = render(
      <NagoReveal as="article">
        <p>Nagô</p>
      </NagoReveal>,
    );
    expect(container.firstElementChild?.tagName).toBe("ARTICLE");
  });

  it("adds the media reveal class", () => {
    const { container } = render(
      <NagoReveal variant="media">
        <img alt="" src="/x.png" />
      </NagoReveal>,
    );
    expect(container.firstElementChild).toHaveClass("nago-reveal-media");
    expect(container.querySelector(".nago-reveal-media-frame")).toBeTruthy();
  });

  it("slides in from the side and exposes a drift layer", () => {
    const { container } = render(
      <NagoReveal from="left" drift={18}>
        <p>Nagô</p>
      </NagoReveal>,
    );
    expect(container.firstElementChild).toHaveClass("nago-reveal-from-left");
    const drift = container.querySelector("[data-nago-drift]") as HTMLElement;
    expect(drift).toHaveAttribute("data-nago-drift", "18");
    expect(drift).toHaveClass("nago-scroll-drift");
  });

  it("masks a line and ignores from and drift", () => {
    const { container } = render(
      <NagoReveal variant="mask" from="left" drift={18}>
        <h2>Horarios</h2>
      </NagoReveal>,
    );
    expect(container.firstElementChild).toHaveClass("nago-reveal-mask");
    expect(container.firstElementChild).not.toHaveClass("nago-reveal-from-left");
    expect(container.querySelector("[data-nago-drift]")).toBeNull();
    expect(container.querySelector(".nago-reveal-mask-inner")).toBeTruthy();
  });
});
