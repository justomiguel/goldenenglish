"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { applyDraftOp, lockPathForOp, type DraftOp } from "@/lib/theme-document/editorDraftOps";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import type { ThemeDocumentIssue } from "@/lib/theme-document/validateThemeDocument";
import type { Locale } from "@/types/i18n";

export interface ThemeVersionRow {
  id: string;
  version: number;
  documentHash: string;
  publishedAt: string;
}

export type EditorActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; path?: string; issues?: ThemeDocumentIssue[] };

export interface ThemeDocumentEditorActions {
  save(input: {
    locale: Locale;
    siteThemeId: string;
    document: ThemeDocumentV1;
    baseHash: string | null;
  }): Promise<EditorActionResult<{ documentHash: string }>>;
  publish(input: {
    locale: Locale;
    siteThemeId: string;
    expectedHash: string | null;
  }): Promise<EditorActionResult<{ version: number }>>;
  discard(input: { locale: Locale; siteThemeId: string }): Promise<EditorActionResult<{ discarded: true }>>;
  rollback(input: {
    locale: Locale;
    siteThemeId: string;
    snapshotId: string;
  }): Promise<EditorActionResult<{ version: number }>>;
}

export interface ThemeDocumentEditorInput {
  locale: Locale;
  siteThemeId: string;
  actorRole: "staff" | "admin";
  initial: { document: ThemeDocumentV1; baseHash: string | null; versions: ThemeVersionRow[] };
  actions: ThemeDocumentEditorActions;
}

function lockedFor(role: "staff" | "admin", editableBy: ThemeDocumentV1["editableBy"], path: string): boolean {
  if (role === "staff") return false;
  return (editableBy[path] ?? "staff") !== "admin";
}

export function useThemeDocumentEditor(input: ThemeDocumentEditorInput) {
  const { refresh } = useRouter();
  const [document, setDocument] = useState(input.initial.document);
  const [baseHash, setBaseHash] = useState(input.initial.baseHash);
  const [dirty, setDirty] = useState(false);
  const [issues, setIssues] = useState<ThemeDocumentIssue[]>([]);
  const [versions] = useState(input.initial.versions);
  const [error, setError] = useState<{ code: string; path?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isLocked = useCallback(
    (path: string) => lockedFor(input.actorRole, document.editableBy, path),
    [document.editableBy, input.actorRole],
  );

  const apply = useCallback(
    (op: DraftOp) => {
      const path = lockPathForOp(op);
      if (lockedFor(input.actorRole, document.editableBy, path)) {
        setError({ code: "field_locked", path });
        return;
      }
      setDocument((current) => applyDraftOp(current, op));
      setDirty(true);
      setError(null);
    },
    [document.editableBy, input.actorRole],
  );

  const run = useCallback(
    async (work: () => Promise<EditorActionResult<unknown>>, onOk: (result: { ok: true; data: unknown }) => void) => {
      setIsLoading(true);
      const result = await work();
      setIsLoading(false);
      if (!result.ok) {
        setError({ code: result.code, path: result.path });
        setIssues(result.issues ?? []);
        return;
      }
      setError(null);
      setIssues([]);
      onOk(result);
      refresh();
    },
    [refresh],
  );

  const save = useCallback(
    () =>
      run(
        () => input.actions.save({ locale: input.locale, siteThemeId: input.siteThemeId, document, baseHash }),
        (result) => {
          const data = result.data as { documentHash: string };
          setBaseHash(data.documentHash);
          setDirty(false);
        },
      ),
    [baseHash, document, input.actions, input.locale, input.siteThemeId, run],
  );

  const publish = useCallback(
    () =>
      run(
        () => input.actions.publish({ locale: input.locale, siteThemeId: input.siteThemeId, expectedHash: baseHash }),
        () => setDirty(false),
      ),
    [baseHash, input.actions, input.locale, input.siteThemeId, run],
  );

  const discard = useCallback(
    () =>
      run(
        () => input.actions.discard({ locale: input.locale, siteThemeId: input.siteThemeId }),
        () => setDirty(false),
      ),
    [input.actions, input.locale, input.siteThemeId, run],
  );

  const rollback = useCallback(
    (snapshotId: string) =>
      run(
        () => input.actions.rollback({ locale: input.locale, siteThemeId: input.siteThemeId, snapshotId }),
        () => setDirty(false),
      ),
    [input.actions, input.locale, input.siteThemeId, run],
  );

  return {
    data: { document, dirty, issues, versions },
    error,
    isLoading,
    handlers: { apply, save, publish, discard, rollback, isLocked },
  };
}
