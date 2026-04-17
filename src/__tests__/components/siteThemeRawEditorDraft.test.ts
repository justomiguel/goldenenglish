import { describe, expect, it } from "vitest";
import {
  buildInitialRawEditorDraft,
  isRawEditorDraftDirty,
} from "@/components/dashboard/admin/cms/siteThemeRawEditorDraft";
import type { RawPropertyRow } from "@/lib/cms/buildRawPropertyRows";

const ROWS: ReadonlyArray<RawPropertyRow> = [
  {
    key: "color.primary",
    defaultValue: "#111",
    overrideValue: null,
    isOverridden: false,
  },
  {
    key: "color.secondary",
    defaultValue: "#222",
    overrideValue: "#ff0000",
    isOverridden: true,
  },
  {
    key: "social.tiktok",
    defaultValue: null,
    overrideValue: "https://tiktok.com/@ge",
    isOverridden: true,
  },
];

describe("buildInitialRawEditorDraft", () => {
  it("mirrors only rows with an active override", () => {
    expect(buildInitialRawEditorDraft(ROWS)).toEqual({
      "color.secondary": "#ff0000",
      "social.tiktok": "https://tiktok.com/@ge",
    });
  });
});

describe("isRawEditorDraftDirty", () => {
  it("is clean for the initial draft", () => {
    const draft = buildInitialRawEditorDraft(ROWS);
    expect(isRawEditorDraftDirty(ROWS, draft)).toBe(false);
  });

  it("detects added keys", () => {
    const draft = {
      ...buildInitialRawEditorDraft(ROWS),
      "app.name": "Golden",
    };
    expect(isRawEditorDraftDirty(ROWS, draft)).toBe(true);
  });

  it("detects removed keys", () => {
    const draft = { ...buildInitialRawEditorDraft(ROWS) };
    delete draft["color.secondary"];
    expect(isRawEditorDraftDirty(ROWS, draft)).toBe(true);
  });

  it("detects value changes", () => {
    const draft = {
      ...buildInitialRawEditorDraft(ROWS),
      "color.secondary": "#00ff00",
    };
    expect(isRawEditorDraftDirty(ROWS, draft)).toBe(true);
  });
});
