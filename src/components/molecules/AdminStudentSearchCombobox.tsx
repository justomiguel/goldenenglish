"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";

/** Minimal shape for student pickers (aligned with `AdminStudentSearchHit`). */
export interface AdminStudentSearchHitLike {
  id: string;
  label: string;
}

export interface AdminStudentSearchComboboxProps {
  id: string;
  /** Same pattern as `AdminUsersToolbar` (filter label). */
  labelText: string;
  placeholder: string;
  inputTitle?: string;
  minCharsHint: string;
  /** Minimum trimmed length before calling `search` (default 1). Ignored when `prefetchWhenEmptyOnFocus` loads the empty-query list. */
  minQueryLength?: number;
  debounceMs?: number;
  disabled?: boolean;
  /**
   * When true, an empty query still runs `search("")` after debounce (bounded list from the action).
   * Use for section enrollment and similar; keep false for parent/tutor pickers.
   */
  prefetchWhenEmptyOnFocus?: boolean;
  search: (query: string) => Promise<AdminStudentSearchHitLike[]>;
  onPick: (hit: AdminStudentSearchHitLike) => void;
  /** Change after a successful action to clear the field (e.g. enrollment completed). */
  resetKey?: number | string;
  /** Row ids already chosen elsewhere (e.g. enrollment queue) — hidden from this dropdown. */
  excludeIds?: readonly string[];
  /** Shown above the result rows inside the suggestions panel (e.g. “Available to add”). */
  resultsListHeading?: string;
}

export function AdminStudentSearchCombobox({
  id,
  labelText,
  placeholder,
  inputTitle,
  minCharsHint,
  minQueryLength = 1,
  debounceMs = 280,
  disabled,
  prefetchWhenEmptyOnFocus = false,
  search,
  onPick,
  resetKey,
  excludeIds,
  resultsListHeading,
}: AdminStudentSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AdminStudentSearchHitLike[]>([]);
  const fetchGen = useRef(0);

  useEffect(() => {
    fetchGen.current += 1;
    queueMicrotask(() => {
      setQuery("");
      setHits([]);
    });
  }, [resetKey]);

  useEffect(() => {
    if (disabled) {
      queueMicrotask(() => setHits([]));
      return;
    }
    const q = query.trim();
    if (q.length === 0 && !prefetchWhenEmptyOnFocus) {
      queueMicrotask(() => setHits([]));
      return;
    }
    if (q.length > 0 && q.length < minQueryLength) {
      queueMicrotask(() => setHits([]));
      return;
    }

    const ex = new Set(excludeIds ?? []);
    const gen = ++fetchGen.current;
    const t = window.setTimeout(() => {
      void search(q).then((rows) => {
        const filtered = rows.filter((h) => !ex.has(h.id));
        if (fetchGen.current === gen) setHits(filtered);
      });
    }, debounceMs);
    return () => {
      clearTimeout(t);
    };
  }, [query, minQueryLength, prefetchWhenEmptyOnFocus, debounceMs, search, disabled, excludeIds]);

  const qTrim = query.trim();
  const showMinHint = minQueryLength > 1 && qTrim.length > 0 && qTrim.length < minQueryLength;
  const showList =
    hits.length > 0 && (qTrim.length >= minQueryLength || (prefetchWhenEmptyOnFocus && qTrim.length === 0));

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{labelText}</Label>
      <Input
        id={id}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        title={inputTitle}
        disabled={disabled}
        autoComplete="off"
        className="w-full"
      />
      {showMinHint ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">{minCharsHint}</p>
      ) : null}
      {showList ? (
        <div className="mt-2 overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
          {resultsListHeading ? (
            <p className="border-b border-[var(--color-border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {resultsListHeading}
            </p>
          ) : null}
          <ul className="m-0 max-h-40 list-none overflow-y-auto p-0">
            {hits.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-[var(--color-muted)]"
                  onClick={() => {
                    onPick(h);
                    setQuery(h.label);
                    setHits([]);
                  }}
                >
                  {h.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
