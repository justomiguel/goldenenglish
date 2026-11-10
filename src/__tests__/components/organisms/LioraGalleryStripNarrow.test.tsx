// Narrow gallery: native swipe list. The counter follows the scroll position,
// autoplay stops at the first touch, and there are no arrow buttons.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LioraGalleryStripNarrow } from "@/components/organisms/LioraGalleryStripNarrow";
import type { LioraGalleryItem } from "@/lib/landing/lioraGalleryImages";

const items: LioraGalleryItem[] = [1, 2, 3, 4].map((n) => ({ kind: "photo", src: `/g/${n}.jpg` }));

function renderStrip(onOpen = vi.fn()) {
  render(
    <LioraGalleryStripNarrow
      items={items}
      listLabel="Galería"
      frameLabel={(i) => `Ampliar foto ${i + 1}`}
      positionLabel={(current, total) => `Foto ${current} de ${total}`}
      pauseLabel="Pausar"
      playLabel="Reproducir"
      onOpen={onOpen}
    />,
  );
  const list = screen.getByRole("list", { name: "Galería" });
  Object.defineProperty(list, "scrollWidth", { configurable: true, value: 1200 });
  return { list, onOpen };
}

describe("LioraGalleryStripNarrow", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders every frame in a snap list with no arrow buttons", () => {
    const { list } = renderStrip();
    expect(list.className).toContain("snap-x");
    expect(list.querySelectorAll(":scope > li")).toHaveLength(items.length);
    expect(screen.queryByRole("button", { name: /anterior|siguiente|previous|next/i })).toBeNull();
  });

  it("moves the counter with the scroll position", () => {
    const { list } = renderStrip();
    expect(screen.getByText("Foto 1 de 4")).toBeInTheDocument();
    list.scrollLeft = 600;
    fireEvent.scroll(list);
    expect(screen.getByText("Foto 3 de 4")).toBeInTheDocument();
  });

  it("advances every 4 seconds until the first touch", () => {
    vi.useFakeTimers();
    const { list } = renderStrip();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText("Foto 2 de 4")).toBeInTheDocument();
    fireEvent.pointerDown(list);
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(screen.getByText("Foto 2 de 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reproducir" })).toBeInTheDocument();
  });

  it("opens the viewer at the tapped frame", () => {
    const { onOpen } = renderStrip();
    fireEvent.click(screen.getByRole("button", { name: "Ampliar foto 3" }));
    expect(onOpen).toHaveBeenCalledWith(2);
  });
});
