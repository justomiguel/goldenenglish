// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import { VersionsTab } from "@/components/desktop/organisms/theme-document-editor/versions/VersionsTab";

const labels = en.admin.designEditor.versions;
const upgrade = en.admin.designEditor.upgrade;

const row = {
  id: "snap-1",
  version: 3,
  publishedOn: "2026-11-11",
  author: "Ada",
  documentHash: "abcdef1234567890",
};

const section: ThemeSection = { id: "hero", variantId: "hero.bleed", major: 1, props: { title: "North" } };

function renderTab(actorRole: "staff" | "admin", editableBy: Record<string, "staff" | "admin"> = {}) {
  const onRollback = vi.fn();
  const view = render(
    <VersionsTab
      rows={[row]}
      sections={[section]}
      actorRole={actorRole}
      editableBy={editableBy}
      latestMajorFor={() => 2}
      findVariant={() => ({ id: "hero.bleed", major: 2, propsSchema: { safeParse: () => ({ success: true, data: {} }) } })}
      labels={labels}
      upgradeLabels={upgrade}
      onRollback={onRollback}
    />,
  );
  return { onRollback, unmount: view.unmount };
}

describe("VersionsTab", () => {
  it("lists version, date, author, and the hash prefix", () => {
    renderTab("staff");
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("2026-11-11")).toBeTruthy();
    expect(screen.getByText("Ada")).toBeTruthy();
    expect(screen.getByText("abcdef12")).toBeTruthy();
  });

  it("asks for confirmation and then rolls back", () => {
    const { onRollback } = renderTab("staff");
    fireEvent.click(screen.getByRole("button", { name: labels.rollback.replace("{version}", "3") }));
    fireEvent.click(screen.getByRole("button", { name: labels.confirm }));
    expect(onRollback).toHaveBeenCalledWith("snap-1");
  });

  it("shows rollback for an admin only when staff unlocked it", () => {
    const { unmount } = render(
      <VersionsTab
        rows={[row]}
        sections={[]}
        actorRole="admin"
        editableBy={{}}
        latestMajorFor={() => null}
        findVariant={() => null}
        labels={labels}
        upgradeLabels={upgrade}
        onRollback={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: labels.rollback.replace("{version}", "3") })).toBeNull();
    unmount();
    render(
      <VersionsTab
        rows={[row]}
        sections={[]}
        actorRole="admin"
        editableBy={{ "publish.rollback": "admin" }}
        latestMajorFor={() => null}
        findVariant={() => null}
        labels={labels}
        upgradeLabels={upgrade}
        onRollback={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: labels.rollback.replace("{version}", "3") })).toBeTruthy();
  });

  it("shows upgrade rows for staff only", () => {
    const staff = renderTab("staff");
    expect(screen.getByRole("button", { name: upgrade.preview })).toBeTruthy();
    staff.unmount();
    render(
      <VersionsTab
        rows={[]}
        sections={[section]}
        actorRole="admin"
        editableBy={{ "publish.rollback": "admin" }}
        latestMajorFor={() => 2}
        findVariant={() => ({ id: "hero.bleed", major: 2, propsSchema: { safeParse: () => ({ success: true, data: {} }) } })}
        labels={labels}
        upgradeLabels={upgrade}
        onRollback={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: upgrade.preview })).toBeNull();
  });
});
