import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

vi.mock("@/components/organisms/NagoFontRoot", () => ({
  NagoFontRoot: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  }),
}));

import { PublicBlogScreenNago } from "@/components/organisms/PublicBlogScreenNago";

describe("PublicBlogScreenNago", () => {
  it("keeps the events and blog sheet on the dark nago surface", () => {
    const { container } = render(
      <PublicBlogScreenNago
        locale="es"
        dict={dictEn}
        brand={mockBrandPublic}
        sessionEmail={null}
        blogEnabled
        blogLabel="Blog"
        eventsLabel="Eventos"
      >
        <h1>Eventos</h1>
      </PublicBlogScreenNago>,
    );

    expect(screen.getByRole("heading", { name: "Eventos" })).toBeInTheDocument();
    const sheet = container.querySelector(".nago-public-sheet");
    expect(sheet).toBeTruthy();
    expect(sheet?.className).not.toContain("color-surface");
    expect(sheet?.className).toContain("nago-bg-2");

    const header = container.querySelector(".nago-site-header");
    const main = container.querySelector("main");
    expect(main?.contains(header)).toBe(false);
    expect(
      header &&
        main &&
        (header.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING) !==
          0,
    ).toBe(true);
  });
});
