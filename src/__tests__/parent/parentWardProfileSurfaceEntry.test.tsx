import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { render, screen, act } from "@testing-library/react";
import type { AppSurface } from "@/hooks/useAppSurface";

const mockUseAppSurface = vi.fn<() => AppSurface>();

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => mockUseAppSurface(),
}));

import { ParentWardProfileSurfaceEntry } from "@/components/parent/ParentWardProfileSurfaceEntry";

describe("ParentWardProfileSurfaceEntry", () => {
  beforeEach(() => {
    mockUseAppSurface.mockReturnValue("web-desktop");
  });

  it("renders skeleton pulse markup during SSR string render", () => {
    const html = renderToString(
      <ParentWardProfileSurfaceEntry>
        <p>Ward</p>
      </ParentWardProfileSurfaceEntry>,
    );
    expect(html).toContain("animate-pulse");
  });

  it("renders children on desktop surface after mount", async () => {
    render(
      <ParentWardProfileSurfaceEntry>
        <p>Ward content</p>
      </ParentWardProfileSurfaceEntry>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("Ward content")).toBeInTheDocument();
  });

  it("uses PwaPageShell branch on pwa-mobile", async () => {
    mockUseAppSurface.mockReturnValue("pwa-mobile");
    render(
      <ParentWardProfileSurfaceEntry>
        <p>Mobile ward</p>
      </ParentWardProfileSurfaceEntry>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("Mobile ward")).toBeInTheDocument();
  });

  it("uses narrow branch on web-mobile", async () => {
    mockUseAppSurface.mockReturnValue("web-mobile");
    render(
      <ParentWardProfileSurfaceEntry>
        <p>Browser mobile</p>
      </ParentWardProfileSurfaceEntry>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("Browser mobile")).toBeInTheDocument();
  });
});
