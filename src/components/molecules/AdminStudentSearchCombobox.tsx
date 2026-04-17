"use client";

import { useEffect, useState } from "react";
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
  minQueryLength?: number;
  debounceMs?: number;
  disabled?: boolean;
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
  minQueryLength = 2,
  debounceMs = 280,
  disabled,
  search,
  onPick,
  resetKey,
}: AdminStudentSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AdminStudentSearchHitLike[]>([]);
  const [resetSnapshot, setResetSnapshot] = useState(resetKey);

  if (resetKey !== resetSnapshot) {
    setResetSnapshot(resetKey);
    setQuery("");
    setHits([]);
  }

  useEffect(() => {
    const q = query.trim();
    if (q.length < minQueryLength) return;
    const t = window.setTimeout(() => {
      void search(q).then(setHits);
    }, debounceMs);
    return () => window.clearTimeout(t);
  }, [query, minQueryLength, debounceMs, search]);

  const displayHits = query.trim().length < minQueryLength ? [] : hits;
  const showMinHint = query.trim().length > 0 && query.trim().length < minQueryLength;

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
      {displayHits.length > 0 ? (
        <ul className="mt-2 max-h-40 overflow-y-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
          {displayHits.map((h) => (
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
