import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ParentWardProfileSurfaceEntry } from "@/components/parent/ParentWardProfileSurfaceEntry";

vi.mock("@/components/molecules/SurfaceMountGate", () => ({
  SurfaceMountGate: ({ desktop }: { desktop: ReactNode }) => desktop,
}));

describe("ParentWardProfileSurfaceEntry", () => {
  it("renders children inside the Tier A surface gate", () => {
    render(
      <ParentWardProfileSurfaceEntry>
        <p>Ward content</p>
      </ParentWardProfileSurfaceEntry>,
    );
    expect(screen.getByText("Ward content")).toBeInTheDocument();
  });
});
