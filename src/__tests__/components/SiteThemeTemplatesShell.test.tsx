import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import type { SiteThemeRow } from "@/types/theming";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const { createMock, renameMock, duplicateMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  renameMock: vi.fn(),
  duplicateMock: vi.fn(),
}));
vi.mock("@/app/[locale]/dashboard/admin/cms/siteThemeActions", () => ({
  createSiteThemeAction: createMock,
  renameSiteThemeAction: renameMock,
  duplicateSiteThemeAction: duplicateMock,
}));

const { activateMock, archiveMock, restoreMock } = vi.hoisted(() => ({
  activateMock: vi.fn(),
  archiveMock: vi.fn(),
  restoreMock: vi.fn(),
}));
vi.mock("@/app/[locale]/dashboard/admin/cms/siteThemeStateActions", () => ({
  activateSiteThemeAction: activateMock,
  archiveSiteThemeAction: archiveMock,
  restoreSiteThemeAction: restoreMock,
}));

import { SiteThemeTemplatesShell } from "@/components/dashboard/admin/cms/SiteThemeTemplatesShell";
import type { ThemePreviewTokens } from "@/lib/cms/themePreviewTokens";

const labels = dictEn.admin.cms.templates;

const TOKENS: ThemePreviewTokens = {
  colorPrimary: "#103A5C",
  colorPrimaryForeground: "#FFFFFF",
  colorSecondary: "#A31A22",
  colorSecondaryForeground: "#FFFFFF",
  colorAccent: "#F0B932",
  colorBackground: "#FAF9F6",
  colorSurface: "#FFFFFF",
  colorForeground: "#103A5C",
  colorMuted: "#F0EFEA",
  colorMutedForeground: "#5C6B7A",
  colorBorder: "#E2E0D8",
  layoutBorderRadius: "0.75rem",
};

function tokensFor(rows: SiteThemeRow[]): Record<string, ThemePreviewTokens> {
  const map: Record<string, ThemePreviewTokens> = {};
  for (const r of rows) map[r.id] = TOKENS;
  return map;
}

function row(overrides: Partial<SiteThemeRow> = {}): SiteThemeRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "spring-2026",
    name: "Spring 2026",
    isActive: false,
    isSystemDefault: false,
    templateKind: "classic",
    properties: {},
    content: {},
    blocks: [],
    archivedAt: null,
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-04-01T10:00:00Z",
    updatedBy: null,
    ...overrides,
  };
}

function systemDefaultRow(overrides: Partial<SiteThemeRow> = {}): SiteThemeRow {
  return row({
    id: "00000000-0000-4000-8000-0000000000ff",
    slug: "default",
    name: "Tema por defecto",
    isSystemDefault: true,
    isActive: true,
    ...overrides,
  });
}

describe("SiteThemeTemplatesShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMock.mockResolvedValue({ ok: true, id: "x" });
    renameMock.mockResolvedValue({ ok: true, id: "x" });
    duplicateMock.mockResolvedValue({ ok: true, id: "x" });
    activateMock.mockResolvedValue({ ok: true, id: "x" });
    archiveMock.mockResolvedValue({ ok: true, id: "x" });
    restoreMock.mockResolvedValue({ ok: true, id: "x" });
  });

  it("renders the empty state when there are no templates", () => {
    render(
      <SiteThemeTemplatesShell
        locale="en"
        labels={labels}
        rows={[]}
        total={0}
        truncated={false}
        tokensByThemeId={{}}
        brandName="Golden English"
      />,
    );
    expect(screen.getByText(labels.emptyState)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp(labels.createCta, "i") }),
    ).toBeInTheDocument();
  });

  it("renders the templateKind label in the kind column", () => {
    const rows = [
      row({ templateKind: "classic", slug: "default-classic" }),
      row({
        id: "00000000-0000-4000-8000-000000000002",
        templateKind: "editorial",
        slug: "ed-2026",
        name: "Spring Editorial 2026",
      }),
      row({
        id: "00000000-0000-4000-8000-000000000003",
        templateKind: "minimal",
        slug: "min-2026",
        name: "Spring Minimal 2026",
      }),
    ];
    render(
      <SiteThemeTemplatesShell
        locale="en"
        labels={labels}
        rows={rows}
        total={3}
        truncated={false}
        tokensByThemeId={tokensFor(rows)}
        brandName="Golden English"
      />,
    );
    const kindLabels = labels.landing.kindPicker.options;
    expect(screen.getByText(kindLabels.classic)).toBeInTheDocument();
    expect(screen.getByText(kindLabels.editorial)).toBeInTheDocument();
    expect(screen.getByText(kindLabels.minimal)).toBeInTheDocument();
  });

  it("hides archived rows by default and reveals them via the toggle", () => {
    const active = row({ id: "a1", isActive: true, slug: "active-2026" });
    const archived = row({
      id: "a2",
      slug: "winter-2025",
      name: "Winter 2025",
      archivedAt: "2026-01-01T00:00:00Z",
    });
    render(
      <SiteThemeTemplatesShell
        locale="en"
        labels={labels}
        rows={[active, archived]}
        total={2}
        truncated={false}
        tokensByThemeId={tokensFor([active, archived])}
        brandName="Golden English"
      />,
    );
    expect(screen.getByText(active.name)).toBeInTheDocument();
    expect(screen.queryByText(archived.name)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByLabelText(new RegExp(labels.filterShowArchived, "i")),
    );
    expect(screen.getByText(archived.name)).toBeInTheDocument();
  });

  it("renders the truncated notice with shown / total interpolated", () => {
    const rows = [row()];
    render(
      <SiteThemeTemplatesShell
        locale="en"
        labels={labels}
        rows={rows}
        total={101}
        truncated
        tokensByThemeId={tokensFor(rows)}
        brandName="Golden English"
      />,
    );
    const expected = labels.truncatedNotice
      .replace("{{shown}}", "1")
      .replace("{{total}}", "101");
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("flags exactly one active theme with the prominent active badge", () => {
    const active = row({ id: "a-active", isActive: true, name: "Live theme" });
    const draft = row({ id: "a-draft", slug: "draft-2026", name: "Draft" });
    render(
      <SiteThemeTemplatesShell
        locale="en"
        labels={labels}
        rows={[active, draft]}
        total={2}
        truncated={false}
        tokensByThemeId={tokensFor([active, draft])}
        brandName="Golden English"
      />,
    );
    const badges = screen.getAllByText(labels.preview.activeBadge);
    expect(badges.length).toBe(1);
    const activeArticle = screen.getByLabelText(
      new RegExp(`${active.name}.*${labels.statusActive}`, "i"),
    );
    expect(activeArticle).toBeInTheDocument();
  });

  it("decorates the system default row with the system badge and hides Archive", () => {
    const systemDefault = systemDefaultRow({ isActive: true });
    const draft = row({ id: "a-draft", slug: "draft-2026", name: "Draft" });
    render(
      <SiteThemeTemplatesShell
        locale="en"
        labels={labels}
        rows={[systemDefault, draft]}
        total={2}
        truncated={false}
        tokensByThemeId={tokensFor([systemDefault, draft])}
        brandName="Golden English"
      />,
    );
    // System badge appears once and only above the system default card.
    const systemBadges = screen.getAllByText(labels.preview.defaultBaseLabel);
    expect(systemBadges.length).toBe(1);

    const archiveButtons = screen.queryAllByRole("button", {
      name: new RegExp(labels.archiveCta, "i"),
    });
    // Active rows never expose Archive, system default never exposes Archive
    // either; only non-active, non-system-default rows do (`draft` here).
    expect(archiveButtons.length).toBe(1);
  });
});
