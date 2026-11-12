// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { z } from "zod";
import en from "@/dictionaries/en.json";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import { UpgradeRow } from "@/components/desktop/organisms/theme-document-editor/versions/UpgradeRow";

const labels = en.admin.designEditor.upgrade;
const issues = en.admin.themeDocument.issue;
const section: ThemeSection = { id: "hero", variantId: "hero.bleed", major: 1, props: { title: "North" } };

describe("UpgradeRow", () => {
  it("previews a valid migration", () => {
    render(
      <UpgradeRow
        scope="home"
        section={section}
        fleetCount={4}
        labels={labels}
        issueMessages={issues}
        target={{
          id: "hero.bleed",
          major: 2,
          propsSchema: z.object({ title: z.string() }),
          migrateProps: () => ({ title: "Migrated" }),
        }}
        onApply={vi.fn()}
      />,
    );
    expect(screen.getByText(labels.fleet.replace("{count}", "4"))).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: labels.preview }));
    expect(screen.getByText(labels.ready)).toBeTruthy();
  });

  it("shows upgrade_props_invalid when the new props fail", () => {
    render(
      <UpgradeRow
        scope="home"
        section={section}
        fleetCount={0}
        labels={labels}
        issueMessages={issues}
        target={{
          id: "hero.bleed",
          major: 2,
          propsSchema: z.object({ title: z.string() }),
          migrateProps: () => ({ title: 1 }),
        }}
        onApply={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: labels.preview }));
    expect(screen.getByRole("alert").textContent).toContain("upgrade_props_invalid");
  });

  it("emits setVariant and setField when applied", () => {
    const onApply = vi.fn();
    render(
      <UpgradeRow
        scope="home"
        section={section}
        fleetCount={1}
        labels={labels}
        issueMessages={issues}
        target={{
          id: "hero.bleed",
          major: 2,
          propsSchema: z.object({ title: z.string() }),
          migrateProps: () => ({ title: "Migrated" }),
        }}
        onApply={onApply}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: labels.apply }));
    expect(onApply).toHaveBeenCalledWith({
      kind: "setVariant",
      scope: "home",
      sectionId: "hero",
      variantId: "hero.bleed",
      major: 2,
    });
    expect(onApply).toHaveBeenCalledWith({
      kind: "setField",
      scope: "home",
      sectionId: "hero",
      field: "title",
      value: "Migrated",
    });
  });
});
