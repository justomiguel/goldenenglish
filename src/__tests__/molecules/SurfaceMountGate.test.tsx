import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { render, screen, act } from "@testing-library/react";
import type { AppSurface } from "@/hooks/useAppSurface";

const mockUseAppSurface = vi.fn<() => AppSurface>();

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => mockUseAppSurface(),
}));

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";

describe("SurfaceMountGate", () => {
  beforeEach(() => {
    mockUseAppSurface.mockReturnValue("web-desktop");
  });

  it("renders skeleton from server snapshot before mount", () => {
    mockUseAppSurface.mockReturnValue("web-desktop");
    const html = renderToString(
      <SurfaceMountGate
        skeleton={<span data-testid="sk">Skeleton</span>}
        desktop={<span data-testid="dk">Desktop</span>}
        narrow={() => <span>Narrow</span>}
      />,
    );
    expect(html).toContain("data-testid=\"sk\"");
    expect(html).not.toContain("data-testid=\"dk\"");
  });

  it("renders desktop after mount when surface is web-desktop", async () => {
    mockUseAppSurface.mockReturnValue("web-desktop");
    render(
      <SurfaceMountGate
        skeleton={<div>Skeleton</div>}
        desktop={<div>Desktop</div>}
        narrow={() => <div>Narrow</div>}
      />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("Desktop")).toBeInTheDocument();
  });

  it("calls narrow on mobile surfaces", async () => {
    mockUseAppSurface.mockReturnValue("web-mobile");
    render(
      <SurfaceMountGate
        skeleton={<div>Skeleton</div>}
        desktop={<div>Desktop</div>}
        narrow={(s) => <div data-testid="n">{s}</div>}
      />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("n")).toHaveTextContent("web-mobile");
  });

  it("calls narrow for pwa-mobile after mount", async () => {
    mockUseAppSurface.mockReturnValue("pwa-mobile");
    render(
      <SurfaceMountGate
        skeleton={<div>Skeleton</div>}
        desktop={<div>Desktop</div>}
        narrow={(s) => <div data-testid="n">{s}</div>}
      />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("n")).toHaveTextContent("pwa-mobile");
  });
});
