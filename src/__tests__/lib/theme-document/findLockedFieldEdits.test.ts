import { describe, expect, it } from "vitest";
import { COLOR_TOKEN_KEYS, type DesignTokensV1 } from "@/lib/design-tokens/designTokensV1";
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

function document(patch: Partial<ThemeDocumentV1> = {}): ThemeDocumentV1 {
  return {
    contractVersion: 1,
    tokens: tokens(),
    fontIds: { heading: "fraunces", body: "dm-sans" },
    sections: [{ id: "hero", variantId: "hero.bleed", major: 1, props: { title: "North" } }],
    pages: {},
    editableBy: {},
    ...patch,
  };
}

describe("findLockedFieldEdits", () => {
  it("lets staff change editableBy and section props", () => {
    const prev = document();
    const next = document({
      editableBy: { "sections.hero.props.title": "admin" },
      sections: [{ id: "hero", variantId: "hero.split", major: 1, props: { title: "South" } }],
    });
    expect(findLockedFieldEdits(prev, next, "staff")).toEqual([]);
  });

  it("blocks an admin edit of editableBy", () => {
    const prev = document();
    const next = document({ editableBy: { "sections.order": "admin" } });
    expect(findLockedFieldEdits(prev, next, "admin")).toEqual(["editableBy"]);
  });

  it("lets an admin edit a prop marked admin", () => {
    const prev = document({ editableBy: { "sections.hero.props.title": "admin" } });
    const next = document({
      editableBy: prev.editableBy,
      sections: [{ id: "hero", variantId: "hero.bleed", major: 1, props: { title: "South" } }],
    });
    expect(findLockedFieldEdits(prev, next, "admin")).toEqual([]);
  });

  it("blocks an admin prop edit when the lock is missing", () => {
    const prev = document();
    const next = document({
      sections: [{ id: "hero", variantId: "hero.bleed", major: 1, props: { title: "South" } }],
    });
    expect(findLockedFieldEdits(prev, next, "admin")).toEqual(["sections.hero.props.title"]);
  });

  it("blocks an admin reorder unless sections.order is admin", () => {
    const sections = [
      { id: "band", variantId: "band.paper", major: 1, props: {} },
      { id: "hero", variantId: "hero.bleed", major: 1, props: { title: "North" } },
    ];
    const prev = document();
    const next = document({ sections });
    expect(findLockedFieldEdits(prev, next, "admin")).toContain("sections.order");
    const open = document({ editableBy: { "sections.order": "admin" } });
    expect(findLockedFieldEdits(open, document({ editableBy: open.editableBy, sections }), "admin")).not.toContain(
      "sections.order",
    );
  });

  it("reports a variant swap on sections.<id>.variant", () => {
    const prev = document();
    const next = document({
      sections: [{ id: "hero", variantId: "hero.split", major: 1, props: { title: "North" } }],
    });
    expect(findLockedFieldEdits(prev, next, "admin")).toEqual(["sections.hero.variant"]);
  });
});
