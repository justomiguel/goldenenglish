"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function useBlogArticleEditor<T extends Record<string, unknown>>(initial: T) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initial),
    [draft, initial],
  );

  function patch(next: Partial<T>) {
    setDraft((prev) => ({ ...prev, ...next }));
  }

  function onSaved() {
    router.refresh();
  }

  return {
    draft,
    isDirty,
    patch,
    onSaved,
    setDraft,
  };
}
