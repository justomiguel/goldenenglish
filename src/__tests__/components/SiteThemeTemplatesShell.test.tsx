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

const labels = dictEn.admin.cms.templates;

function row(overrides: Partial<SiteThemeRow> = {}): SiteThemeRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "spring-2026",
    name: "Spring 2026",
    isActive: false,
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
      />,
    );
    expect(screen.getByText(labels.emptyState)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp(labels.createCta, "i") }),
    ).toBeInTheDocument();
  });

  it("renders the templateKind label in the kind column", () => {
    render(
      <SiteThemeTemplatesShell
        locale="en"
        labels={labels}
        rows={[
          row({ templateKind: "classic", slug: "default" }),
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
        ]}
        total={3}
        truncated={false}
      />,
    );
    const kindLabels = labels.landing.kindPicker.options;
    expect(screen.getByText(kindLabels.classic)).toBeInTheDocument();
    expect(screen.getByText(kindLabels.editorial)).toBeInTheDocument();
    expect(screen.getByText(kindLabels.minimal)).toBeInTheDocument();
  });

  it("hides archived rows by default and reveals them via the toggle", () => {
    const active = row({ id: "a1", isActive: true, slug: "default" });
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
    render(
      <SiteThemeTemplatesShell
        locale="en"
        labels={labels}
        rows={[row()]}
        total={101}
        truncated
      />,
    );
    const expected = labels.truncatedNotice
      .replace("{{shown}}", "1")
      .replace("{{total}}", "101");
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
