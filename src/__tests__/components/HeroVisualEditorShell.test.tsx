import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dictEn } from "@/test/dictEn";
import type { LandingSectionEditorViewModel } from "@/lib/cms/buildLandingEditorViewModel";
import type { SiteThemeRow } from "@/types/theming";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const { updateMock, resetMock } = vi.hoisted(() => ({
  updateMock: vi.fn(),
  resetMock: vi.fn(),
}));
vi.mock("@/app/[locale]/dashboard/admin/cms/siteThemeContentActions", () => ({
  updateSiteThemeContentAction: updateMock,
  resetSiteThemeContentAction: resetMock,
}));

import { HeroVisualEditorShell } from "@/components/dashboard/admin/cms/HeroVisualEditorShell";

const labels = dictEn.admin.cms.templates.landing;
const themeId = "00000000-0000-4000-8000-000000000099";

const theme: SiteThemeRow = {
  id: themeId,
  slug: "classic",
  name: "Classic",
  isActive: true,
  isSystemDefault: false,
  templateKind: "classic",
  properties: {},
  content: {},
  blocks: [],
  archivedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  updatedBy: null,
};

const section: LandingSectionEditorViewModel = {
  section: "inicio",
  copy: [
    {
      key: "hero.kicker",
      defaults: { es: "Bienvenidos", en: "Welcome" },
      overrides: { es: null, en: null },
    },
    {
      key: "hero.ctaRegister",
      defaults: { es: "Inscribirme", en: "Register" },
      overrides: { es: null, en: null },
    },
    {
      key: "hero.ctaSignedIn",
      defaults: { es: "Ir al panel", en: "Open dashboard" },
      overrides: { es: null, en: null },
    },
    {
      key: "hero.whatsappCta",
      defaults: { es: "WhatsApp", en: "WhatsApp" },
      overrides: { es: null, en: null },
    },
  ],
  media: [],
  blocks: [],
};

beforeEach(() => {
  refreshMock.mockReset();
  updateMock.mockReset();
  resetMock.mockReset();
});

describe("HeroVisualEditorShell", () => {
  it("renders editor title, copy fields and the live preview", () => {
    render(
      <HeroVisualEditorShell
        locale="en"
        labels={labels}
        theme={theme}
        section={section}
        brandName="Golden English"
      />,
    );
    expect(
      screen.getByRole("heading", { name: labels.heroEditor.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("hero.kicker")).toBeInTheDocument();
    const preview = screen.getByRole("complementary", {
      name: labels.heroEditor.previewTitle,
    });
    expect(within(preview).getByText("Golden English")).toBeInTheDocument();
    expect(within(preview).getByText("Bienvenidos")).toBeInTheDocument();
  });

  it("toggles preview locale when the EN button is pressed", () => {
    render(
      <HeroVisualEditorShell
        locale="en"
        labels={labels}
        theme={theme}
        section={section}
        brandName="GE"
      />,
    );
    const preview = screen.getByRole("complementary", {
      name: labels.heroEditor.previewTitle,
    });
    expect(within(preview).getByText("Bienvenidos")).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "en" }));
    });
    expect(within(preview).getByText("Welcome")).toBeInTheDocument();
    expect(within(preview).queryByText("Bienvenidos")).toBeNull();
  });

  it("invokes updateSiteThemeContentAction with the typed draft on save", async () => {
    updateMock.mockResolvedValueOnce({ ok: true });
    render(
      <HeroVisualEditorShell
        locale="en"
        labels={labels}
        theme={theme}
        section={section}
        brandName="GE"
      />,
    );
    const esInputs = screen.getAllByLabelText(labels.labelEs);
    await act(async () => {
      fireEvent.change(esInputs[0]!, { target: { value: "Nuevo kicker" } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.saveCopyCta }));
    });
    expect(updateMock).toHaveBeenCalledTimes(1);
    const callArg = updateMock.mock.calls[0]![0];
    expect(callArg).toMatchObject({
      locale: "en",
      id: themeId,
      section: "inicio",
    });
    expect(callArg.copy["hero.kicker"]).toEqual({ es: "Nuevo kicker", en: "" });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(labels.saveCopySuccess);
  });
});
