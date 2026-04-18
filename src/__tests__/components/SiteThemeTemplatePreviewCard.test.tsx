import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import type { SiteThemeRow } from "@/types/theming";
import type { ThemePreviewTokens } from "@/lib/cms/themePreviewTokens";
import { SiteThemeTemplatePreviewCard } from "@/components/dashboard/admin/cms/SiteThemeTemplatePreviewCard";

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

function renderCard(overrides: Partial<SiteThemeRow> = {}) {
  return render(
    <SiteThemeTemplatePreviewCard
      locale="en"
      labels={labels}
      row={row(overrides)}
      tokens={TOKENS}
      pending={false}
      brandName="Golden English"
      onActivate={vi.fn()}
      onRename={vi.fn()}
      onDuplicate={vi.fn()}
      onArchive={vi.fn()}
      onRestore={vi.fn()}
    />,
  );
}

describe("SiteThemeTemplatePreviewCard", () => {
  it("shows the active badge with the configured copy when isActive", () => {
    renderCard({ isActive: true });
    expect(screen.getByText(labels.preview.activeBadge)).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: labels.preview.activeBadgeAriaLabel }),
    ).toBeInTheDocument();
  });

  it("does not render the active badge for draft themes", () => {
    renderCard({ isActive: false });
    expect(screen.queryByText(labels.preview.activeBadge)).not.toBeInTheDocument();
    expect(screen.getByText(labels.statusDraft)).toBeInTheDocument();
  });

  it("renders the brand name interpolated inside the preview body sample", () => {
    renderCard({ isActive: true });
    const body = labels.preview.bodySample.replace("{{brand}}", "Golden English");
    expect(screen.getByText(body)).toBeInTheDocument();
  });

  it("hides the activate CTA when the theme is already active", () => {
    renderCard({ isActive: true });
    expect(
      screen.queryByRole("button", { name: new RegExp(labels.activateCta, "i") }),
    ).not.toBeInTheDocument();
  });

  it("hides the activate / archive CTAs and shows restore for archived themes", () => {
    renderCard({ archivedAt: "2026-01-01T00:00:00Z" });
    expect(
      screen.queryByRole("button", { name: new RegExp(labels.activateCta, "i") }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: new RegExp(labels.archiveCta, "i") }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp(labels.restoreCta, "i") }),
    ).toBeInTheDocument();
  });

  it("links to editor / landing / hero / properties for non-archived themes", () => {
    renderCard();
    const links = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links).toEqual(
      expect.arrayContaining([
        "/en/dashboard/admin/cms/templates/00000000-0000-4000-8000-000000000001",
        "/en/dashboard/admin/cms/templates/00000000-0000-4000-8000-000000000001/landing",
        "/en/dashboard/admin/cms/templates/00000000-0000-4000-8000-000000000001/hero",
        "/en/dashboard/admin/cms/templates/00000000-0000-4000-8000-000000000001/properties",
      ]),
    );
  });

  it("renders the templateKind label inside the meta block", () => {
    renderCard({ templateKind: "editorial" });
    const article = screen.getByLabelText(/Spring 2026/);
    expect(
      within(article).getByText(labels.landing.kindPicker.options.editorial),
    ).toBeInTheDocument();
  });

  it("decorates the system default row with the system badge and hides the Archive CTA", () => {
    renderCard({ isSystemDefault: true, isActive: false });
    expect(
      screen.getByText(labels.preview.defaultBaseLabel),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: new RegExp(labels.archiveCta, "i") }),
    ).not.toBeInTheDocument();
  });

  it("never decorates a non-system row with the system badge", () => {
    renderCard({ isSystemDefault: false });
    expect(
      screen.queryByText(labels.preview.defaultBaseLabel),
    ).not.toBeInTheDocument();
  });
});
