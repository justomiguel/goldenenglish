"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Default debounce delay for search inputs (ms).
 * Provides responsive UX while avoiding excessive server requests.
 */
export const SEARCH_DEBOUNCE_MS = 300;

export interface UseDebouncedSearchOptions {
  /** Initial/server value for the search query */
  value: string;
  /** Callback fired after debounce delay when user stops typing */
  onDebouncedChange: (value: string) => void;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
}

export interface UseDebouncedSearchReturn {
  /** Current local input value (updates immediately on keystroke) */
  localValue: string;
  /** Handler for input onChange — updates local state instantly */
  setLocalValue: (value: string) => void;
  /** Flush the current value immediately (e.g., on form submit) */
  flushNow: () => void;
}

/**
 * Hook for debounced search inputs.
 *
 * Provides instant visual feedback while delaying the actual search callback
 * until the user stops typing. Syncs with server value when it changes.
 *
 * @example
 * ```tsx
 * const { localValue, setLocalValue, flushNow } = useDebouncedSearch({
 *   value: searchQuery,
 *   onDebouncedChange: (q) => pushParams({ q }),
 * });
 *
 * <form onSubmit={(e) => { e.preventDefault(); flushNow(); }}>
 *   <Input value={localValue} onChange={(e) => setLocalValue(e.target.value)} />
 * </form>
 * ```
 */
export function useDebouncedSearch({
  value,
  onDebouncedChange,
  debounceMs = SEARCH_DEBOUNCE_MS,
}: UseDebouncedSearchOptions): UseDebouncedSearchReturn {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDebouncedChangeRef = useRef(onDebouncedChange);

  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (localValue === value) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onDebouncedChangeRef.current(localValue);
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localValue, value, debounceMs]);

  const flushNow = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (localValue !== value) {
      onDebouncedChangeRef.current(localValue);
    }
  }, [localValue, value]);

  return { localValue, setLocalValue, flushNow };
}
