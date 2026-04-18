import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import type { SiteThemeRow } from "@/types/theming";
import type { RawPropertyRow } from "@/lib/cms/buildRawPropertyRows";

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

import { SiteThemeRawEditorShell } from "@/components/dashboard/admin/cms/SiteThemeRawEditorShell";

const labels = dictEn.admin.cms.templates.properties;

const theme: SiteThemeRow = {
  id: "00000000-0000-4000-8000-000000000010",
  slug: "default",
  name: "Default",
  isActive: true,
  isSystemDefault: true,
  templateKind: "classic",
  properties: { "color.primary": "#abcdef" },
  content: {},
  blocks: [],
  archivedAt: null,
  createdAt: "2026-04-01T10:00:00Z",
  updatedAt: "2026-04-01T10:00:00Z",
  updatedBy: null,
};

const rows: ReadonlyArray<RawPropertyRow> = [
  {
    key: "color.primary",
    defaultValue: "#103A5C",
    overrideValue: "#abcdef",
    isOverridden: true,
  },
  {
    key: "color.secondary",
    defaultValue: "#A31A22",
    overrideValue: null,
    isOverridden: false,
  },
];

describe("SiteThemeRawEditorShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMock.mockResolvedValue({ ok: true, id: theme.id });
    resetMock.mockResolvedValue({ ok: true, id: theme.id });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("renders the title with the template name and a row per allow-listed key", () => {
    render(
      <SiteThemeRawEditorShell
        locale="en"
        labels={labels}
        theme={theme}
        rows={rows}
      />,
    );
    expect(
      screen.getByRole("heading", {
        name: labels.title.replace("{{name}}", theme.name),
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("color.primary")).toBeInTheDocument();
    expect(screen.getByLabelText("color.secondary")).toBeInTheDocument();
  });

  it("disables save when the draft mirrors the committed overrides", () => {
    render(
      <SiteThemeRawEditorShell
        locale="en"
        labels={labels}
        theme={theme}
        rows={rows}
      />,
    );
    expect(
      screen.getByRole("button", { name: labels.saveCta }),
    ).toBeDisabled();
  });

  it("enables save and persists the merged draft when a row is edited", async () => {
    render(
      <SiteThemeRawEditorShell
        locale="en"
        labels={labels}
        theme={theme}
        rows={rows}
      />,
    );
    const secondary = screen.getByLabelText("color.secondary");
    fireEvent.change(secondary, { target: { value: "#ff0000" } });

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
        overrides: expect.objectContaining({
          "color.primary": "#abcdef",
          "color.secondary": "#ff0000",
        }),
      }),
    );
  });

  it("removes an override from the draft when reset is clicked", async () => {
    render(
      <SiteThemeRawEditorShell
        locale="en"
        labels={labels}
        theme={theme}
        rows={rows}
      />,
    );
    const resetButtons = screen.getAllByRole("button", {
      name: labels.resetRowCta,
    });
    await act(async () => {
      fireEvent.click(resetButtons[0]);
    });

    const save = screen.getByRole("button", { name: labels.saveCta });
    expect(save).toBeEnabled();
    await act(async () => {
      fireEvent.click(save);
    });

    expect(updateMock).toHaveBeenCalledTimes(1);
    const payload = updateMock.mock.calls[0][0] as {
      overrides: Record<string, string>;
    };
    expect(payload.overrides).not.toHaveProperty("color.primary");
  });

  it("adds a brand new override via the add form", async () => {
    render(
      <SiteThemeRawEditorShell
        locale="en"
        labels={labels}
        theme={theme}
        rows={rows}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(labels.addKeyPlaceholder), {
      target: { value: "social.tiktok" },
    });
    fireEvent.change(screen.getByPlaceholderText(labels.addValuePlaceholder), {
      target: { value: "https://tiktok.com/@ge" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.addCta }));
    });

    const save = screen.getByRole("button", { name: labels.saveCta });
    expect(save).toBeEnabled();
    await act(async () => {
      fireEvent.click(save);
    });

    expect(updateMock).toHaveBeenCalledTimes(1);
    const payload = updateMock.mock.calls[0][0] as {
      overrides: Record<string, string>;
    };
    expect(payload.overrides["social.tiktok"]).toBe("https://tiktok.com/@ge");
  });

  it("rejects keys outside the allow-list with an inline error", () => {
    render(
      <SiteThemeRawEditorShell
        locale="en"
        labels={labels}
        theme={theme}
        rows={rows}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(labels.addKeyPlaceholder), {
      target: { value: "legal.age.majority" },
    });
    fireEvent.change(screen.getByPlaceholderText(labels.addValuePlaceholder), {
      target: { value: "21" },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.addCta }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      labels.addErrors.key_invalid,
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("invokes the reset-all action after confirming", async () => {
    render(
      <SiteThemeRawEditorShell
        locale="en"
        labels={labels}
        theme={theme}
        rows={rows}
      />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: labels.resetAllCta }),
      );
    });
    expect(resetMock).toHaveBeenCalledTimes(1);
    expect(resetMock).toHaveBeenCalledWith({ locale: "en", id: theme.id });
  });
});
