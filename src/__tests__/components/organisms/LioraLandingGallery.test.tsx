// REGRESSION CHECK: The third frame opens video 1. A photo slide must not render a video element.
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import dictEs from "@/dictionaries/es.json";
import { LioraLandingGallery } from "@/components/organisms/LioraLandingGallery";
import type { Dictionary } from "@/types/i18n";

beforeAll(() => {
  HTMLVideoElement.prototype.play = vi.fn(() => Promise.resolve());
  HTMLVideoElement.prototype.pause = vi.fn();
});

function galleryStart(): string | null {
  return document.querySelector("[data-gallery-start]")?.getAttribute("data-gallery-start") ?? null;
}

const originalMatchMedia = window.matchMedia;

describe("LioraLandingGallery", () => {
  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it("advances the visible frame every 4 seconds", () => {
    vi.useFakeTimers();
    render(<LioraLandingGallery dict={dictEs as Dictionary} />);
    expect(galleryStart()).toBe("0");
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(galleryStart()).toBe("1");
  });

  it("stays on the first frame when motion is reduced", () => {
    vi.useFakeTimers();
    window.matchMedia = (query: string) =>
      ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList;
    render(<LioraLandingGallery dict={dictEs as Dictionary} />);
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(galleryStart()).toBe("0");
  });

  it("keeps a photo slide free of video and plays video 1 from its frame", async () => {
    const user = userEvent.setup();
    render(<LioraLandingGallery dict={dictEs as Dictionary} />);

    await user.click(screen.getByRole("button", { name: "Ampliar foto 1" }));
    expect(document.querySelector("video")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Reproducir video 1" }));
    expect(document.querySelector("video")).toHaveAttribute(
      "src",
      "/images/liora/galeria/v1.mp4",
    );
    expect(screen.getByRole("button", { name: "Reproducir" })).toBeInTheDocument();
  });
});
