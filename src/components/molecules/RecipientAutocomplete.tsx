"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/atoms/Input";
import {
  filterMessagingRecipientsByQuery,
  groupMessagingRecipientsForPicker,
  messagingRecipientDisplayName,
} from "@/lib/messaging/recipientSearch";
import { useComboboxDropdownPosition } from "@/hooks/useComboboxDropdownPosition";
import type { MessagingRecipient } from "@/types/messaging";

export interface RecipientAutocompleteProps {
  id: string;
  options: MessagingRecipient[];
  value: string;
  onValueChange: (nextId: string) => void;
  disabled?: boolean;
  placeholder: string;
  noMatchesText: string;
  /** Shown in the dropdown when there are no recipients to choose (e.g. RLS or only self in DB). */
  emptyOptionsText: string;
  roleLabels: Record<string, string>;
  /** Accessible name for the text field (e.g. translated “To”) */
  ariaLabel: string;
  /** Optional native tooltip on the combobox input (dictionary-backed). */
  inputTitle?: string;
}

export function RecipientAutocomplete({
  id,
  options,
  value,
  onValueChange,
  disabled,
  placeholder,
  noMatchesText,
  emptyOptionsText,
  roleLabels,
  ariaLabel,
  inputTitle,
}: RecipientAutocompleteProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevValueRef = useRef(value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(-1);

  const showPanel = open && !disabled;
  const rect = useComboboxDropdownPosition(showPanel, inputRef);

  const filtered = useMemo(() => filterMessagingRecipientsByQuery(options, query), [options, query]);

  const grouped = useMemo(
    () => groupMessagingRecipientsForPicker(filtered, roleLabels),
    [filtered, roleLabels],
  );

  const flatOptions = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  const flatIndexById = useMemo(() => {
    const m = new Map<string, number>();
    flatOptions.forEach((r, i) => m.set(r.id, i));
    return m;
  }, [flatOptions]);

  useEffect(() => {
    const prev = prevValueRef.current;
    prevValueRef.current = value;
    queueMicrotask(() => {
      if (!value) {
        if (prev) setQuery("");
        return;
      }
      const sel = options.find((o) => o.id === value);
      if (sel) setQuery(messagingRecipientDisplayName(sel));
    });
  }, [value, options]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      const root = rootRef.current;
      const portal = portalRef.current;
      if (root?.contains(t) || portal?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const pick = useCallback(
    (r: MessagingRecipient) => {
      onValueChange(r.id);
      setQuery(messagingRecipientDisplayName(r));
      setOpen(false);
      inputRef.current?.blur();
    },
    [onValueChange],
  );

  const onInputChange = (next: string) => {
    setHighlight(-1);
    setQuery(next);
    if (value) {
      const sel = options.find((o) => o.id === value);
      if (sel && messagingRecipientDisplayName(sel) !== next) {
        onValueChange("");
      }
    }
    setOpen(true);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!flatOptions.length) return;
      setHighlight((h) => (h < 0 ? 0 : (h + 1) % flatOptions.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!flatOptions.length) return;
      setHighlight((h) =>
        h < 0 ? flatOptions.length - 1 : (h - 1 + flatOptions.length) % flatOptions.length,
      );
    } else if (e.key === "Enter") {
      if (!open || !flatOptions.length) return;
      const idx =
        highlight >= 0 ? highlight : flatOptions.length === 1 ? 0 : -1;
      if (idx < 0) return;
      e.preventDefault();
      pick(flatOptions[idx]);
    }
  };

  function closePanelIfFocusOutside(e: React.FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget as Node | null;
    if (next) {
      if (rootRef.current?.contains(next)) return;
      if (portalRef.current?.contains(next)) return;
    }
    setOpen(false);
    if (value) {
      const sel = options.find((o) => o.id === value);
      if (sel) setQuery(messagingRecipientDisplayName(sel));
    }
  }

  const dropdown =
    showPanel && rect ? (
      <div
        ref={portalRef}
        className="fixed z-[100] max-h-60 overflow-y-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-md"
        style={{
          top: rect.top + 4,
          left: rect.left,
          width: Math.max(rect.width, 200),
        }}
      >
        <ul id={listId} role="listbox" className="m-0 list-none p-0">
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[var(--color-muted-foreground)]" role="status">
              {emptyOptionsText}
            </li>
          ) : flatOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[var(--color-muted-foreground)]" role="presentation">
              {noMatchesText}
            </li>
          ) : (
            grouped.map((g) => (
              <li key={g.role} role="presentation" className="list-none">
                <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  {g.label}
                </div>
                <ul className="list-none p-0">
                  {g.items.map((r) => {
                    const flatIdx = flatIndexById.get(r.id) ?? 0;
                    const active = highlight >= 0 && flatIdx === highlight;
                    return (
                      <li key={r.id} role="none" className="list-none">
                        <button
                          type="button"
                          role="option"
                          aria-selected={value === r.id}
                          className={`flex min-h-[44px] w-full items-center px-3 py-2 text-left text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] ${
                            active ? "bg-[var(--color-muted)]" : ""
                          }`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pick(r)}
                        >
                          {messagingRecipientDisplayName(r)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))
          )}
        </ul>
      </div>
    ) : null;

  return (
    <div ref={rootRef} className="relative z-40" onBlur={closePanelIfFocusOutside}>
      <Input
        ref={inputRef}
        id={id}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={Boolean(showPanel && rect)}
        aria-controls={listId}
        aria-label={ariaLabel}
        title={inputTitle}
        disabled={disabled}
        placeholder={placeholder}
        value={query}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={() => {
          setHighlight(-1);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="min-h-[44px] bg-[var(--color-background)]"
      />
      {typeof document !== "undefined" && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
