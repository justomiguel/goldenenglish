import { describe, expect, it } from "vitest";
import { COLOR_TOKEN_KEYS, type DesignTokensV1 } from "@/lib/design-tokens/designTokensV1";
import { applyDraftOp, lockPathForOp, type DraftOp } from "@/lib/theme-document/editorDraftOps";
import { findLockedFieldEdits } from "@/lib/theme-document/findLockedFieldEdits";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";

function tokens(): DesignTokensV1 {
  const color = Object.fromEntries(COLOR_TOKEN_KEYS.map((key) => [key, "#112233"])) as DesignTokensV1["color"];
  return {
    version: 1,
    color,
    font: { heading: "fraunces", body: "dm-sans" },
    type: { scale: "standard", headingWeight: 600 },
    radius: { control: "0.75rem", card: "0.75rem" },
    space: { density: "standard" },
    shadow: { soft: "none", card: "none" },
    motion: { level: "subtle" },
  };
}

function document(): ThemeDocumentV1 {
  return {
    contractVersion: 1,
    tokens: tokens(),
    fontIds: { heading: "fraunces", body: "dm-sans" },
    sections: [
      { id: "hero", variantId: "hero.bleed", major: 1, props: { title: "North" } },
      { id: "band", variantId: "band.paper", major: 1, props: { sentence: "Quiet" } },
    ],
    pages: {
      contact: { sections: [{ id: "form", variantId: "contact.form", major: 1, props: { title: "Hello" } }] },
    },
    editableBy: {},
  };
}

const ops: DraftOp[] = [
  { kind: "setToken", path: "color.primary", value: "#ABCDEF" },
  { kind: "setToken", path: "type.scale", value: "compact" },
  { kind: "setFont", role: "heading", id: "literata" },
  { kind: "setField", scope: "home", sectionId: "hero", field: "title", value: "South" },
  { kind: "setField", scope: "contact", sectionId: "form", field: "title", value: "Write" },
  { kind: "moveSection", scope: "home", sectionId: "band", toIndex: 0 },
  { kind: "addSection", scope: "home", section: { id: "faq", variantId: "faq.list", major: 1, props: {} }, atIndex: 1 },
  { kind: "removeSection", scope: "home", sectionId: "band" },
  { kind: "setVariant", scope: "home", sectionId: "hero", variantId: "hero.split", major: 2 },
  { kind: "setLock", path: "sections.hero.props.title", role: "admin" },
];

describe("applyDraftOp", () => {
  it("returns a new document and leaves the input unchanged", () => {
    for (const op of ops) {
      const prev = document();
      const snapshot = JSON.stringify(prev);
      const next = applyDraftOp(prev, op);
      expect(next).not.toBe(prev);
      expect(JSON.stringify(prev)).toBe(snapshot);
    }
  });

  it("moves one section and keeps the other", () => {
    const next = applyDraftOp(document(), { kind: "moveSection", scope: "home", sectionId: "band", toIndex: 0 });
    expect(next.sections.map((section) => section.id)).toEqual(["band", "hero"]);
    expect(next.sections[1]?.props).toEqual({ title: "North" });
  });

  it("edits a page section under pages.contact", () => {
    const next = applyDraftOp(document(), {
      kind: "setField",
      scope: "contact",
      sectionId: "form",
      field: "title",
      value: "Write",
    });
    expect(next.pages.contact?.sections[0]?.props).toEqual({ title: "Write" });
    expect(next.sections[0]?.props).toEqual({ title: "North" });
  });

  it("reports the same lock path that findLockedFieldEdits reports", () => {
    for (const op of ops) {
      const prev = document();
      const next = applyDraftOp(prev, op);
      expect(findLockedFieldEdits(prev, next, "admin")).toContain(lockPathForOp(op));
    }
  });
});
