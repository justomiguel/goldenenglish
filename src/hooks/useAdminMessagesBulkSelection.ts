"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  bulkDeleteAdminPortalMessages,
  bulkSetAdminPortalMessageReadState,
} from "@/app/[locale]/dashboard/admin/messages/bulkActions";
import { ADMIN_MESSAGE_BULK_ID_CAP } from "@/lib/messaging/adminMessageBulkIds";

export type BulkSelectionErrorCode =
  | "empty"
  | "invalid_id"
  | "too_many"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "persist_failed";

interface UseAdminMessagesBulkSelectionArgs {
  locale: string;
  /** Clears selection when the active folder changes. */
  folderKey: string;
  visibleIds: string[];
}

export function useAdminMessagesBulkSelection({
  locale,
  folderKey,
  visibleIds,
}: UseAdminMessagesBulkSelectionArgs) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<BulkSelectionErrorCode | null>(null);
  const [selectionFolderKey, setSelectionFolderKey] = useState(folderKey);

  // Reset selection when the folder changes (render-time adjust — no effect).
  if (folderKey !== selectionFolderKey) {
    setSelectionFolderKey(folderKey);
    setSelected(new Set());
    setErrorCode(null);
  }

  const selectedCount = selected.size;
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= ADMIN_MESSAGE_BULK_ID_CAP) return prev;
        next.add(id);
      }
      return next;
    });
    setErrorCode(null);
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelected(new Set(visibleIds.slice(0, ADMIN_MESSAGE_BULK_ID_CAP)));
    setErrorCode(null);
  }, [visibleIds]);

  const clear = useCallback(() => {
    setSelected(new Set());
    setErrorCode(null);
  }, []);

  const selectedIds = () => [...selected];

  async function runMark(unread: boolean): Promise<boolean> {
    const ids = selectedIds();
    if (ids.length === 0) return false;
    setBusy(true);
    setErrorCode(null);
    const res = await bulkSetAdminPortalMessageReadState(locale, ids, unread);
    setBusy(false);
    if (!res.ok) {
      setErrorCode(res.code);
      return false;
    }
    clear();
    router.refresh();
    return true;
  }

  async function runDelete(): Promise<boolean> {
    const ids = selectedIds();
    if (ids.length === 0) return false;
    setBusy(true);
    setErrorCode(null);
    const res = await bulkDeleteAdminPortalMessages(locale, ids);
    setBusy(false);
    if (!res.ok) {
      setErrorCode(res.code);
      return false;
    }
    clear();
    router.refresh();
    return true;
  }

  return {
    selected,
    selectedCount,
    allVisibleSelected,
    busy,
    errorCode,
    toggle,
    selectAllVisible,
    clear,
    markRead: () => runMark(false),
    markUnread: () => runMark(true),
    deleteSelected: runDelete,
  };
}
