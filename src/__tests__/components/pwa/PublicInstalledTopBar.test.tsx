import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dictEn } from "@/test/dictEn";

const installed = vi.hoisted(() => ({ current: false }));

vi.mock("@/hooks/useAppSurface", () => ({
  useInstalledDisplay: () => installed.current,
}));

import { PublicExperienceFrame } from "@/components/pwa/molecules/PublicExperienceFrame";

const labels = dictEn.nav.publicPwaBar;

function renderFrame() {
  return render(
    <PublicExperienceFrame
      locale="es"
      sessionEmail={null}
      coursesHref="/es#clases"
      coursesLabel="Cursos"
      labels={labels}
      loginLabel="Ingresar"
      portalLabel="Mi Portal"
      pullCopy={dictEn.pwa.pullToRefresh}
      logoSrc="/images/nago/logo/logo.png"
      logoAlt="Capoeira Nagô"
      localeLabels={dictEn.common.locale}
      variant="nago"
    >
      <p>Page body</p>
    </PublicExperienceFrame>,
  );
}

describe("PublicInstalledTopBar", () => {
  beforeEach(() => {
    installed.current = false;
  });

  it("shows the logo and the language switcher only in the installed app", () => {
    installed.current = true;
    renderFrame();

    expect(screen.getByRole("link", { name: "Capoeira Nagô" })).toHaveAttribute("href", "/es");
    expect(screen.getByRole("navigation", { name: dictEn.common.locale.label })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /menú|menu/i })).toBeNull();
    expect(screen.getByText("Page body")).toBeInTheDocument();
  });

  it("shows the thin bar on a wide installed window", () => {
    installed.current = true;
    renderFrame();

    expect(screen.getByRole("link", { name: "Capoeira Nagô" })).toHaveAttribute("href", "/es");
  });

  it("keeps the marketing page free of the thin bar in the mobile browser", () => {
    installed.current = false;
    renderFrame();

    expect(screen.queryByRole("link", { name: "Capoeira Nagô" })).toBeNull();
    expect(screen.getByText("Page body")).toBeInTheDocument();
  });
});
