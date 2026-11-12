import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import type { BrandPublic } from "@/lib/brand/server";

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => "web-desktop",
}));

vi.mock("@/variants/owned/matiss/font/v1/Web", () => ({
  MatissFontRoot: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/variants/clientEntries", () => {
  function HomeLinks({ links }: { links: { href: string; label: string }[] }) {
    return (
      <nav>
        {links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
    );
  }
  return {
    CLIENT_VARIANT_ENTRIES: {
      "page.matiss-home@1": { web: HomeLinks, pwa: HomeLinks },
    },
  };
});

import { LandingMainSectionsMatiss } from "@/components/organisms/LandingMainSectionsMatiss";

const brand = { name: "Studio", logoAlt: "Studio", logoPath: "/logo.png" } as BrandPublic;

describe("LandingMainSectionsMatiss nav", () => {
  it("shows Events, and shows Blog only when the blog is on", () => {
    const { unmount } = render(
      <LandingMainSectionsMatiss dict={es} brand={brand} locale="es" sessionEmail={null} blogEnabled />,
    );
    expect(screen.getByRole("link", { name: "Eventos" })).toHaveAttribute("href", "/es/events");
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute("href", "/es/blog");
    expect(document.querySelector('[data-variant-entry="page.matiss-home@1"]')).not.toBeNull();
    unmount();

    render(<LandingMainSectionsMatiss dict={es} brand={brand} locale="es" sessionEmail={null} />);
    expect(screen.getByRole("link", { name: "Eventos" })).toHaveAttribute("href", "/es/events");
    expect(screen.queryByRole("link", { name: "Blog" })).toBeNull();
  });
});
