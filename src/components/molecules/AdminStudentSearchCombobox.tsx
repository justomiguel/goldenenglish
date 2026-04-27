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

    const gen = ++fetchGen.current;
    const t = window.setTimeout(() => {
      void search(q).then((rows) => {
        if (fetchGen.current === gen) setHits(rows);
      });
    }, debounceMs);
    return () => {
      clearTimeout(t);
    };
  }, [query, minQueryLength, prefetchWhenEmptyOnFocus, debounceMs, search, disabled]);

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
        <ul className="mt-2 max-h-40 overflow-y-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
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
      ) : null}
    </div>
  );
}
