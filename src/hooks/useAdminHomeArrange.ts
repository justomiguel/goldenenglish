"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { arrayMove } from "@dnd-kit/sortable";
import {
  deleteAdminHomeLayoutAction,
  saveAdminHomeLayoutAction,
} from "@/app/[locale]/dashboard/admin/adminHomeLayoutActions";
import {
  applyAdminHomePreset,
} from "@/lib/dashboard/adminHomePresets";
import {
  factoryAdminHomeLayout,
  moveAdminHomeItem,
  setAdminHomeItemHidden,
  setAdminHomeItemSize,
  type AdminHomeCardSize,
  type AdminHomeLayout,
  type AdminHomePresetId,
  type AdminHomeWidgetId,
} from "@/lib/dashboard/adminHomeLayout";

function reorderVisible(layout: AdminHomeLayout, activeId: string, overId: string): AdminHomeLayout {
  const visibleIds = layout.items.filter((item) => !item.hidden).map((item) => item.id);
  const from = visibleIds.indexOf(activeId as AdminHomeWidgetId);
  const to = visibleIds.indexOf(overId as AdminHomeWidgetId);
  if (from < 0 || to < 0 || from === to) return layout;
  const nextVisible = arrayMove(visibleIds, from, to);
  let cursor = 0;
  return {
    version: 1,
    items: layout.items.map((item) => {
      if (item.hidden) return item;
      const id = nextVisible[cursor];
      cursor += 1;
      return layout.items.find((entry) => entry.id === id) ?? item;
    }),
  };
}

export function useAdminHomeArrange(initial: AdminHomeLayout, locale: string, shopEnabled: boolean) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [snapshot, setSnapshot] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [menuId, setMenuId] = useState<AdminHomeWidgetId | null>(null);

  function start() {
    setSnapshot(draft);
    setError(false);
    setEditing(true);
  }

  function cancel() {
    setDraft(snapshot);
    setMenuId(null);
    setEditing(false);
    setError(false);
  }

  async function done() {
    setBusy(true);
    setError(false);
    const factory = factoryAdminHomeLayout({ shopEnabled });
    const matchesFactory = JSON.stringify(draft.items) === JSON.stringify(factory.items);
    const result = matchesFactory
      ? await deleteAdminHomeLayoutAction({ locale })
      : await saveAdminHomeLayoutAction({ locale, layout: draft });
    setBusy(false);
    if (!result.ok) {
      setError(true);
      return;
    }
    setMenuId(null);
    setEditing(false);
    router.refresh();
  }

  return {
    editing,
    draft,
    busy,
    error,
    menuId,
    setMenuId,
    start,
    cancel,
    done,
    setSize: (id: AdminHomeWidgetId, size: AdminHomeCardSize) =>
      setDraft((current) => setAdminHomeItemSize(current, id, size)),
    move: (id: AdminHomeWidgetId, direction: "up" | "down") =>
      setDraft((current) => moveAdminHomeItem(current, id, direction)),
    hide: (id: AdminHomeWidgetId) => setDraft((current) => setAdminHomeItemHidden(current, id, true)),
    show: (id: AdminHomeWidgetId) => setDraft((current) => setAdminHomeItemHidden(current, id, false)),
    reorder: (activeId: string, overId: string) =>
      setDraft((current) => reorderVisible(current, activeId, overId)),
    applyPreset: (preset: AdminHomePresetId) =>
      setDraft(applyAdminHomePreset(preset, { shopEnabled })),
  };
}
