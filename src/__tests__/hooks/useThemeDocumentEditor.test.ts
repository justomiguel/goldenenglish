// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { COLOR_TOKEN_KEYS, type DesignTokensV1 } from "@/lib/design-tokens/designTokensV1";
import type { ThemeDocumentIssue } from "@/lib/theme-document/validateThemeDocument";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";

const routerMock = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => routerMock }));

import { useThemeDocumentEditor, type ThemeDocumentEditorActions } from "@/hooks/useThemeDocumentEditor";

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
    sections: [{ id: "hero", variantId: "hero.bleed", major: 1, props: { title: "North" } }],
    pages: {},
    editableBy: {},
  };
}

function actions(overrides: Partial<ThemeDocumentEditorActions> = {}): ThemeDocumentEditorActions {
  return {
    save: vi.fn(async () => ({ ok: true as const, data: { documentHash: "hash-2" } })),
    publish: vi.fn(async () => ({ ok: true as const, data: { version: 1 } })),
    discard: vi.fn(async () => ({ ok: true as const, data: { discarded: true as const } })),
    rollback: vi.fn(async () => ({ ok: true as const, data: { version: 1 } })),
    ...overrides,
  };
}

function setup(actorRole: "staff" | "admin", editorActions = actions()) {
  return renderHook(() =>
    useThemeDocumentEditor({
      locale: "es",
      siteThemeId: "theme-1",
      actorRole,
      initial: { document: document(), baseHash: "hash-1", versions: [] },
      actions: editorActions,
    }),
  );
}

describe("useThemeDocumentEditor", () => {
  beforeEach(() => routerMock.refresh.mockClear());

  it("marks the draft dirty after an edit", () => {
    const { result } = setup("staff");
    act(() => result.current.handlers.apply({ kind: "setToken", path: "color.primary", value: "#ABCDEF" }));
    expect(result.current.data.dirty).toBe(true);
    expect(result.current.data.document.tokens.color.primary).toBe("#ABCDEF");
  });

  it("clears dirty and refreshes after a successful save", async () => {
    const editorActions = actions();
    const { result } = setup("staff", editorActions);
    act(() => result.current.handlers.apply({ kind: "setToken", path: "color.primary", value: "#ABCDEF" }));
    await act(async () => {
      await result.current.handlers.save();
    });
    expect(result.current.data.dirty).toBe(false);
    expect(editorActions.save).toHaveBeenCalledWith(expect.objectContaining({ baseHash: "hash-1" }));
    expect(routerMock.refresh).toHaveBeenCalledOnce();
    await act(async () => {
      await result.current.handlers.save();
    });
    expect(editorActions.save).toHaveBeenLastCalledWith(expect.objectContaining({ baseHash: "hash-2" }));
  });

  it("keeps the draft when the save is stale", async () => {
    const editorActions = actions({
      save: vi.fn(async () => ({ ok: false as const, code: "document_stale" })),
    });
    const { result } = setup("staff", editorActions);
    act(() => result.current.handlers.apply({ kind: "setToken", path: "color.primary", value: "#ABCDEF" }));
    await act(async () => {
      await result.current.handlers.save();
    });
    expect(result.current.error?.code).toBe("document_stale");
    expect(result.current.data.dirty).toBe(true);
    expect(routerMock.refresh).not.toHaveBeenCalled();
  });

  it("stores publish issues", async () => {
    const issues: ThemeDocumentIssue[] = [{ code: "contrast_below_aa", path: "tokens.color.primary" }];
    const editorActions = actions({
      publish: vi.fn(async () => ({ ok: false as const, code: "contrast_below_aa", issues })),
    });
    const { result } = setup("staff", editorActions);
    await act(async () => {
      await result.current.handlers.publish();
    });
    expect(result.current.data.issues).toEqual(issues);
    expect(routerMock.refresh).not.toHaveBeenCalled();
  });

  it("locks a missing key for an admin and leaves it open for staff", () => {
    const admin = setup("admin");
    const staff = setup("staff");
    expect(admin.result.current.handlers.isLocked("tokens.color.primary")).toBe(true);
    expect(staff.result.current.handlers.isLocked("tokens.color.primary")).toBe(false);
  });

  it("ignores an admin edit on a locked path", () => {
    const { result } = setup("admin");
    act(() => result.current.handlers.apply({ kind: "setToken", path: "color.primary", value: "#ABCDEF" }));
    expect(result.current.data.document.tokens.color.primary).toBe("#112233");
    expect(result.current.data.dirty).toBe(false);
    expect(result.current.error?.code).toBe("field_locked");
  });
});
