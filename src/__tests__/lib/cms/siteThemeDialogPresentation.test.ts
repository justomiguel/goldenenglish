import { describe, expect, it } from "vitest";
import {
  buildDialogInitialValues,
  buildDialogLabels,
} from "@/components/dashboard/admin/cms/siteThemeDialogPresentation";
import { dictEn } from "@/test/dictEn";
import type { SiteThemeRow } from "@/types/theming";

const labels = dictEn.admin.cms.templates;

const baseRow: SiteThemeRow = {
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
};

describe("buildDialogLabels", () => {
  it("returns create labels including the activate toggle", () => {
    const result = buildDialogLabels("create", labels);
    expect(result.title).toBe(labels.createDialogTitle);
    expect(result.lead).toBe(labels.createDialogLead);
    expect(result.fieldActivateNow).toBe(labels.fieldActivateNow);
    expect(result.submit).toBe(labels.submitCreate);
  });

  it("omits the activate toggle for rename", () => {
    const result = buildDialogLabels("rename", labels);
    expect(result.title).toBe(labels.renameDialogTitle);
    expect(result.fieldActivateNow).toBeUndefined();
    expect(result.submit).toBe(labels.submitRename);
  });

  it("uses the duplicate dialog copy when kind is duplicate or null", () => {
    const dupResult = buildDialogLabels("duplicate", labels);
    expect(dupResult.title).toBe(labels.duplicateDialogTitle);
    expect(dupResult.lead).toBe(labels.duplicateDialogLead);
    expect(dupResult.submit).toBe(labels.submitDuplicate);
    const fallback = buildDialogLabels(null, labels);
    expect(fallback.title).toBe(labels.duplicateDialogTitle);
  });
});

describe("buildDialogInitialValues", () => {
  it("returns empty defaults for create", () => {
    expect(
      buildDialogInitialValues("create", undefined, new Set()),
    ).toEqual({ initialName: "", initialSlug: "" });
  });

  it("preserves the row name and slug for rename", () => {
    expect(
      buildDialogInitialValues("rename", baseRow, new Set([baseRow.slug])),
    ).toEqual({ initialName: baseRow.name, initialSlug: baseRow.slug });
  });

  it("suggests a unique copy slug for duplicate", () => {
    const existing = new Set([baseRow.slug, `${baseRow.slug}-copy`]);
    const out = buildDialogInitialValues("duplicate", baseRow, existing);
    expect(out.initialName).toBe(baseRow.name);
    expect(out.initialSlug.startsWith(`${baseRow.slug}-copy`)).toBe(true);
    expect(existing.has(out.initialSlug)).toBe(false);
  });
});
