// The Liora tab bar names its classes tab like the landing section ("Clases"),
// not with the generic "Cursos".
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";

vi.mock("@/hooks/useAppSurface", () => ({
  useInstalledDisplay: () => false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/es",
}));

import { PublicExperienceChrome } from "@/components/pwa/molecules/PublicExperienceFrame";

const dict = es as Dictionary;

function renderChrome(templateKind: string) {
  return render(
    <PublicExperienceChrome
      dict={dict}
      locale="es"
      sessionEmail={null}
      templateKind={templateKind}
      logoSrc="/logo.png"
      logoAlt="Logo"
    >
      <p>Body</p>
    </PublicExperienceChrome>,
  );
}

describe("PublicExperienceChrome courses tab label", () => {
  it("uses the Liora section name", () => {
    renderChrome("liora");
    const label = marketingLandingCopy(dict, "liora", "nav.clases");
    expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", "/es#clases");
  });

  it("keeps the generic label for other themes", () => {
    renderChrome("nago");
    expect(screen.getByRole("link", { name: dict.nav.courses })).toBeInTheDocument();
  });
});
