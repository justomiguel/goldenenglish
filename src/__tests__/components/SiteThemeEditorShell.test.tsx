import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import type { SiteThemeRow } from "@/types/theming";
import type { TokenGroup } from "@/lib/cms/groupThemeTokens";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const { updateMock, resetMock } = vi.hoisted(() => ({
  updateMock: vi.fn(),
  resetMock: vi.fn(),
}));
vi.mock(
  "@/app/[locale]/dashboard/admin/cms/siteThemePropertiesActions",
  () => ({
    updateSiteThemePropertiesAction: updateMock,
    resetSiteThemePropertiesAction: resetMock,
  }),
);

import { SiteThemeEditorShell } from "@/components/dashboard/admin/cms/SiteThemeEditorShell";

const labels = dictEn.admin.cms.templates.editor;

const theme: SiteThemeRow = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "default",
  name: "Default",
  isActive: true,
  isSystemDefault: true,
  templateKind: "classic",
  properties: { "color.primary": "#000000" },
  content: {},
  blocks: [],
  archivedAt: null,
  createdAt: "2026-04-01T10:00:00Z",
  updatedAt: "2026-04-01T10:00:00Z",
  updatedBy: null,
};

const groups: ReadonlyArray<TokenGroup> = [
  {
    id: "color",
    tokens: [
      {
        key: "color.primary",
        value: "#000000",
        defaultValue: "#103A5C",
        isOverridden: true,
        kind: "color",
      },
      {
        key: "color.secondary",
        value: "#A31A22",
        defaultValue: "#A31A22",
        isOverridden: false,
        kind: "color",
      },
    ],
  },
  {
    id: "app",
    tokens: [
      {
        key: "app.name",
        value: "Golden English",
        defaultValue: "Golden English",
        isOverridden: false,
        kind: "text",
      },
    ],
  },
];

describe("SiteThemeEditorShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMock.mockResolvedValue({ ok: true, id: theme.id });
    resetMock.mockResolvedValue({ ok: true, id: theme.id });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("renders the title with the template name and group cards", () => {
    render(
      <SiteThemeEditorShell
        locale="en"
        labels={labels}
        theme={theme}
        groups={groups}
      />,
    );
    expect(
      screen.getByRole("heading", {
        name: labels.title.replace("{{name}}", theme.name),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(labels.groups.color.title)).toBeInTheDocument();
    expect(screen.getByText(labels.groups.app.title)).toBeInTheDocument();
  });

  it("disables save when no edit has been made", () => {
    render(
      <SiteThemeEditorShell
        locale="en"
        labels={labels}
        theme={theme}
        groups={groups}
      />,
    );
    const save = screen.getByRole("button", { name: labels.saveCta });
    expect(save).toBeDisabled();
  });

  it("enables save and persists overrides when a token is edited", async () => {
    render(
      <SiteThemeEditorShell
        locale="en"
        labels={labels}
        theme={theme}
        groups={groups}
      />,
    );
    const primary = screen.getByLabelText("color.primary");
    fireEvent.change(primary, { target: { value: "#abcdef" } });

    const save = screen.getByRole("button", { name: labels.saveCta });
    expect(save).toBeEnabled();
    await act(async () => {
      fireEvent.click(save);
    });

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "en",
        id: theme.id,
        overrides: expect.objectContaining({ "color.primary": "#abcdef" }),
      }),
    );
  });

  it("invokes the reset action after confirming", async () => {
    render(
      <SiteThemeEditorShell
        locale="en"
        labels={labels}
        theme={theme}
        groups={groups}
      />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: labels.resetAllCta }),
      );
    });
    expect(resetMock).toHaveBeenCalledTimes(1);
    expect(resetMock).toHaveBeenCalledWith({
      locale: "en",
      id: theme.id,
    });
  });
});
