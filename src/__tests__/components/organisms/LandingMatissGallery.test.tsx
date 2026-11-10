import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LandingMatissGallery } from "@/components/organisms/LandingMatissGallery";
import { formatMatissGalleryPosition, stepGalleryIndex } from "@/lib/landing/matissGalleryCarousel";

vi.mock("@/lib/analytics/trackClient", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/trackClient";

const labels = {
  close: "Cerrar",
  prev: "Foto anterior",
  next: "Foto siguiente",
  position: "{current} de {total}",
};

const photos = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/images/matiss/galeria/${n}.jpg`);

function renderGallery(layout: "mosaic" | "pages", list = photos) {
  return render(
    <LandingMatissGallery title="Así se ve la sala" alt="Alumnas" photos={list} labels={labels} layout={layout} />,
  );
}

describe("matiss gallery position", () => {
  it("speaks a 1-based position", () => {
    expect(formatMatissGalleryPosition("{current} de {total}", 2, 8)).toBe("3 de 8");
    expect(stepGalleryIndex(0, 8, -1)).toBe(7);
    expect(stepGalleryIndex(0, 1, 1)).toBe(0);
  });
});

describe("LandingMatissGallery", () => {
  it("opens the third photo at index 2 and says 3 de 8", async () => {
    const user = userEvent.setup();
    renderGallery("mosaic");
    const buttons = screen.getAllByRole("button", { name: "Alumnas" });
    await user.click(buttons[2]!);
    expect(screen.getByRole("dialog", { name: "Así se ve la sala" })).toBeTruthy();
    expect(screen.getByText("3 de 8")).toBeTruthy();
    expect(trackEvent).toHaveBeenCalledWith("click", "gallery:matiss", { index: 2 });
  });

  it("returns to the mosaic on a wide layout", async () => {
    const user = userEvent.setup();
    renderGallery("mosaic");
    await user.click(screen.getAllByRole("button", { name: "Alumnas" })[0]!);
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Alumnas" })).toHaveLength(8);
  });

  it("returns to the four-photo page on a narrow layout", async () => {
    const user = userEvent.setup();
    const { container } = renderGallery("pages");
    expect(screen.getAllByRole("button", { name: "Alumnas" })).toHaveLength(4);
    await user.click(screen.getAllByRole("button", { name: "Alumnas" })[0]!);
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Alumnas" })).toHaveLength(4);
    expect(container.innerHTML).toContain("/images/matiss/galeria/1.jpg");
    expect(container.innerHTML).not.toContain("/images/matiss/galeria/5.jpg");
  });

  it("does not open an empty list", () => {
    renderGallery("mosaic", []);
    expect(screen.queryByRole("button", { name: "Alumnas" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("disables the arrows when there is one photo", async () => {
    const user = userEvent.setup();
    renderGallery("mosaic", ["/images/matiss/galeria/1.jpg"]);
    await user.click(screen.getByRole("button", { name: "Alumnas" }));
    expect(screen.getByRole("button", { name: "Foto anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Foto siguiente" })).toBeDisabled();
  });

  it("moves to the next photo when the pointer drags left", async () => {
    const user = userEvent.setup();
    renderGallery("mosaic");
    await user.click(screen.getAllByRole("button", { name: "Alumnas" })[2]!);
    const figure = screen.getByRole("dialog").querySelector("figure");
    expect(figure).toBeTruthy();
    await user.pointer([
      { keys: "[MouseLeft>]", target: figure!, coords: { x: 200, y: 20 } },
      { keys: "[/MouseLeft]", target: figure!, coords: { x: 40, y: 20 } },
    ]);
    expect(screen.getByText("4 de 8")).toBeTruthy();
  });
});
