// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import { variantsForTenant } from "@/lib/design-variants/variantRegistry";
import { THEME_PAGE_IDS, type ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { PagesTab } from "@/components/desktop/organisms/theme-document-editor/pages/PagesTab";

const labels = en.admin.designEditor.pages;

function fill(template: string, section: string): string {
  return template.replaceAll("{section}", section);
}

function document(): ThemeDocumentV1 {
  return {
    contractVersion: 1,
    tokens: {
      version: 1,
      color: {
        background: "#FFFFFF",
        foreground: "#111111",
        surface: "#FFFFFF",
        primary: "#112233",
        "primary.foreground": "#FFFFFF",
        secondary: "#334455",
        "secondary.foreground": "#FFFFFF",
        accent: "#556677",
        "accent.foreground": "#FFFFFF",
        muted: "#EEEEEE",
        "muted.foreground": "#111111",
        border: "#CCCCCC",
        success: "#116633",
        warning: "#886600",
        error: "#881111",
        info: "#114488",
      },
      font: { heading: "fraunces", body: "dm-sans" },
      type: { scale: "standard", headingWeight: 600 },
      radius: { control: "0.75rem", card: "0.75rem" },
      space: { density: "standard" },
      shadow: { soft: "none", card: "none" },
      motion: { level: "subtle" },
    },
    fontIds: { heading: "fraunces", body: "dm-sans" },
    sections: [
      { id: "hero", variantId: "hero.bleed", major: 1, props: { title: "North" } },
      { id: "band", variantId: "band.paper", major: 1, props: { items: [] } },
    ],
    pages: {},
    editableBy: {},
  };
}

describe("PagesTab", () => {
  it("lists home and every theme page", () => {
    render(
      <PagesTab document={document()} tenantSlug="golden" isLocked={() => false} onApply={vi.fn()} labels={labels} />,
    );
    expect(screen.getByRole("button", { name: labels.home })).toBeTruthy();
    for (const pageId of THEME_PAGE_IDS) {
      expect(screen.getByRole("button", { name: labels[pageId] })).toBeTruthy();
    }
  });

  it("emits moveSection from the up and down buttons", () => {
    const onApply = vi.fn();
    render(
      <PagesTab document={document()} tenantSlug="golden" isLocked={() => false} onApply={onApply} labels={labels} />,
    );
    fireEvent.click(screen.getByRole("button", { name: fill(labels.moveUp, "band") }));
    expect(onApply).toHaveBeenCalledWith({ kind: "moveSection", scope: "home", sectionId: "band", toIndex: 0 });
    fireEvent.click(screen.getByRole("button", { name: fill(labels.moveDown, "hero") }));
    expect(onApply).toHaveBeenCalledWith({ kind: "moveSection", scope: "home", sectionId: "hero", toIndex: 1 });
  });

  it("lists only the variants for this tenant and slot", () => {
    render(
      <PagesTab document={document()} tenantSlug="golden" isLocked={() => false} onApply={vi.fn()} labels={labels} />,
    );
    const picker = screen.getByRole("combobox", { name: fill(labels.variant, "hero") });
    const values = [...picker.querySelectorAll("option")].map((option) => option.value).sort();
    const expected = variantsForTenant("golden", "hero")
      .map((variant) => `${variant.id}@${variant.major}`)
      .sort();
    expect(values).toEqual(expected);
    expect(values.some((value) => value.startsWith("band."))).toBe(false);
    expect(values.some((value) => value.startsWith("page.bespoke-"))).toBe(false);
  });

  it("hides reorder controls when the section order is locked", () => {
    render(
      <PagesTab
        document={document()}
        tenantSlug="golden"
        isLocked={(path) => path === "sections.order"}
        onApply={vi.fn()}
        labels={labels}
      />,
    );
    expect(screen.queryByRole("button", { name: fill(labels.moveUp, "band") })).toBeNull();
    expect(screen.queryByRole("button", { name: fill(labels.moveDown, "hero") })).toBeNull();
  });
});
