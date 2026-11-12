// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import { COLOR_TOKEN_KEYS, type DesignTokensV1 } from "@/lib/design-tokens/designTokensV1";
import { COLOR_CONTRAST_PAIRS } from "@/lib/design-tokens/validateDesignTokens";
import { contrastRatio } from "@/lib/theme/contrastRatio";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { IdentityTab } from "@/components/desktop/organisms/theme-document-editor/identity/IdentityTab";

const labels = en.admin.designEditor.identity;

function fill(template: string, field: string): string {
  return template.replaceAll("{field}", field);
}

function colorKey(token: string): keyof DesignTokensV1["color"] {
  return token.replace(/^color\./, "") as keyof DesignTokensV1["color"];
}

function document(): ThemeDocumentV1 {
  const color = Object.fromEntries(COLOR_TOKEN_KEYS.map((key) => [key, "#112233"])) as DesignTokensV1["color"];
  color.background = "#FFFFFF";
  color.foreground = "#111111";
  return {
    contractVersion: 1,
    tokens: {
      version: 1,
      color,
      font: { heading: "fraunces", body: "dm-sans" },
      type: { scale: "standard", headingWeight: 600 },
      radius: { control: "0.75rem", card: "0.75rem" },
      space: { density: "standard" },
      shadow: { soft: "none", card: "none" },
      motion: { level: "subtle" },
    },
    fontIds: { heading: "fraunces", body: "dm-sans" },
    sections: [],
    pages: {},
    editableBy: {},
  };
}

function renderTab(
  actorRole: "staff" | "admin",
  tenantSlug: string,
  isLocked: (path: string) => boolean = () => false,
) {
  const onApply = vi.fn();
  render(
    <IdentityTab
      document={document()}
      tenantSlug={tenantSlug}
      actorRole={actorRole}
      isLocked={isLocked}
      onApply={onApply}
      labels={labels}
    />,
  );
  return onApply;
}

describe("IdentityTab", () => {
  it("shows the contrast ratio and an AA pass or fail on every pair", () => {
    renderTab("admin", "golden");
    const doc = document();
    for (const pair of COLOR_CONTRAST_PAIRS) {
      const ratio = Math.round(contrastRatio(doc.tokens.color[colorKey(pair.token)], doc.tokens.color[colorKey(pair.pair)]) * 100) / 100;
      const name = `${labels.fields[colorKey(pair.token)]} / ${labels.fields[colorKey(pair.pair)]}`;
      const row = screen.getByRole("group", { name });
      expect(within(row).getByText(String(ratio))).toBeTruthy();
      expect(within(row).getByText(ratio >= pair.min ? labels.aaPass : labels.aaFail)).toBeTruthy();
    }
    expect(screen.getAllByText(labels.aaPass).length).toBeGreaterThan(0);
    expect(screen.getAllByText(labels.aaFail).length).toBeGreaterThan(0);
  });

  it("lists catalog fonts allowed for the tenant", () => {
    const { unmount } = render(
      <IdentityTab
        document={document()}
        tenantSlug="golden"
        actorRole="staff"
        isLocked={() => false}
        onApply={vi.fn()}
        labels={labels}
      />,
    );
    const open = within(screen.getByRole("combobox", { name: labels.headingFont })).getAllByRole("option");
    expect(open.map((option) => option.textContent)).toContain("Fraunces");
    expect(open.map((option) => option.textContent)).not.toContain("Fast Blaze");
    unmount();
    render(
      <IdentityTab
        document={document()}
        tenantSlug="espaciozenit"
        actorRole="staff"
        isLocked={() => false}
        onApply={vi.fn()}
        labels={labels}
      />,
    );
    const owned = within(screen.getByRole("combobox", { name: labels.headingFont })).getAllByRole("option");
    expect(owned.map((option) => option.textContent)).toContain("Fast Blaze");
  });

  it("renders a locked color as read-only with a notice", () => {
    renderTab("admin", "golden", (path) => path === "tokens.color.background");
    const hex = screen.getAllByRole("textbox", { name: fill(labels.hex, labels.fields.background) })[0];
    expect(hex).toBeDisabled();
    expect(screen.getAllByText(fill(labels.locked, labels.fields.background)).length).toBeGreaterThan(0);
  });

  it("shows a lock toggle to staff and hides it from admins", () => {
    const { unmount } = render(
      <IdentityTab
        document={document()}
        tenantSlug="golden"
        actorRole="staff"
        isLocked={() => false}
        onApply={vi.fn()}
        labels={labels}
      />,
    );
    expect(screen.getAllByRole("button", { name: fill(labels.lock, labels.fields.background) }).length).toBeGreaterThan(0);
    unmount();
    renderTab("admin", "golden");
    expect(screen.queryAllByRole("button", { name: fill(labels.lock, labels.fields.background) })).toHaveLength(0);
  });

  it("writes color and hex changes through apply", () => {
    const onApply = renderTab("staff", "golden");
    fireEvent.change(screen.getAllByLabelText(fill(labels.hex, labels.fields.background))[0], {
      target: { value: "#123456" },
    });
    expect(onApply).toHaveBeenCalledWith({ kind: "setToken", path: "color.background", value: "#123456" });
    fireEvent.change(screen.getAllByLabelText(fill(labels.color, labels.fields.background))[0], {
      target: { value: "#abcdef" },
    });
    expect(onApply).toHaveBeenCalledWith({ kind: "setToken", path: "color.background", value: "#abcdef" });
  });
});
