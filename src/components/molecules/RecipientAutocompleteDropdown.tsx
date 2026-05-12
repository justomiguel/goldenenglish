"use client";

import type { RefObject } from "react";
import {
  messagingRecipientDisplayName,
  type RecipientRoleGroup,
} from "@/lib/messaging/recipientSearch";
import type { ComboboxDropdownRect } from "@/hooks/useComboboxDropdownPosition";
import type { MessagingRecipient } from "@/types/messaging";

export interface RecipientAutocompleteDropdownProps {
  listId: string;
  portalRef: RefObject<HTMLDivElement | null>;
  rect: ComboboxDropdownRect;
  options: MessagingRecipient[];
  emptyOptionsText: string;
  noMatchesText: string;
  grouped: RecipientRoleGroup[];
  flatOptions: MessagingRecipient[];
  flatIndexById: Map<string, number>;
  highlight: number;
  value: string;
  onPick: (r: MessagingRecipient) => void;
}

export function RecipientAutocompleteDropdown({
  listId,
  portalRef,
  rect,
  options,
  emptyOptionsText,
  noMatchesText,
  grouped,
  flatOptions,
  flatIndexById,
  highlight,
  value,
  onPick,
}: RecipientAutocompleteDropdownProps) {
  return (
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
                        onClick={() => onPick(r)}
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
  );
}
