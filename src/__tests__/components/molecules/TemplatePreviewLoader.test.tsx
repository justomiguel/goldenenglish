import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TemplatePreviewLoader } from "@/components/molecules/TemplatePreviewLoader";

describe("TemplatePreviewLoader", () => {
  it("shows a percent and reaches 100 when the load finishes", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    const { rerender } = render(
      <TemplatePreviewLoader label="Cargando la plantilla" locale="es" onDone={onDone} />,
    );
    const bar = screen.getByRole("progressbar", { name: "Cargando la plantilla" });
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(Number(bar.getAttribute("aria-valuenow"))).toBeLessThan(100);

    rerender(
      <TemplatePreviewLoader label="Cargando la plantilla" locale="es" complete onDone={onDone} />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("100 %")).toBeInTheDocument();
    vi.advanceTimersByTime(180);
    expect(onDone).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
