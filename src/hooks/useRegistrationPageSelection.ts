"use client";

import { useState } from "react";

export type RegistrationPageSelection = {
  pageIds: readonly string[];
  selectedIds: string[];
  allMarked: boolean;
  someMarked: boolean;
  toggle: (id: string) => void;
  togglePage: () => void;
  clear: () => void;
};

export function useRegistrationPageSelection(
  pageKey: string,
  pageIds: readonly string[],
): RegistrationPageSelection {
  const [selected, setSelected] = useState<string[]>([]);
  const [seenKey, setSeenKey] = useState(pageKey);
  if (seenKey !== pageKey) {
    setSeenKey(pageKey);
    setSelected([]);
  } else {
    const visible = selected.filter((id) => pageIds.includes(id));
    if (visible.length !== selected.length) setSelected(visible);
  }

  const active = seenKey === pageKey ? selected : [];
  const selectedIds = active.filter((id) => pageIds.includes(id));
  const allMarked = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someMarked = selectedIds.length > 0 && !allMarked;

  function toggle(id: string) {
    setSelected((curr) =>
      curr.includes(id) ? curr.filter((item) => item !== id) : [...curr, id],
    );
  }

  function togglePage() {
    setSelected((curr) => {
      const marked = pageIds.length > 0 && pageIds.every((id) => curr.includes(id));
      return marked ? [] : [...pageIds];
    });
  }

  function clear() {
    setSelected([]);
  }

  return { pageIds, selectedIds, allMarked, someMarked, toggle, togglePage, clear };
}
