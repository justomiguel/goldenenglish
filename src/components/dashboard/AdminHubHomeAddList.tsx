"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { adminHomeCardAbout, adminHomeCardLabel } from "@/lib/dashboard/adminHomeCardLabel";
import {
  visibleAdminHomeCards,
  type AdminHomeLayout,
  type AdminHomeVisibility,
  type AdminHomeWidgetId,
} from "@/lib/dashboard/adminHomeLayout";
import type { Dictionary } from "@/types/i18n";

export function AdminHubHomeAddList({
  labels,
  dict,
  draft,
  visibility,
  onShow,
  onHide,
}: {
  labels: Dictionary["admin"]["home"]["layout"];
  dict: Dictionary;
  draft: AdminHomeLayout;
  visibility: AdminHomeVisibility;
  onShow: (id: AdminHomeWidgetId) => void;
  onHide: (id: AdminHomeWidgetId) => void;
}) {
  const [open, setOpen] = useState(false);
  const revealed = { version: 1 as const, items: draft.items.map((item) => ({ ...item, hidden: false })) };
  const cards = visibleAdminHomeCards(revealed, visibility);
  const onBoard = new Set(visibleAdminHomeCards(draft, visibility).map((card) => card.id));

  return (
    <>
      <Button type="button" variant="primary" size="sm" className="min-h-11" aria-expanded={open} onClick={() => setOpen(true)}>
        <ListChecks className="h-4 w-4" aria-hidden />
        {labels.addTitle}
      </Button>
      <Modal open={open} onOpenChange={setOpen} titleId="admin-home-add-cards" title={labels.addTitle}>
        <ul className="overflow-hidden rounded-xl border border-[var(--color-border)]">
          {cards.map((card) => {
            const name = adminHomeCardLabel(card.id, dict);
            const about = adminHomeCardAbout(card.id, dict);
            const checked = onBoard.has(card.id);
            return (
              <li key={card.id} className="border-b border-[var(--color-border)] last:border-b-0">
                <label className="flex min-h-11 cursor-pointer items-start gap-3 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)]">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-primary)]"
                    checked={checked}
                    onChange={(event) => {
                      if (event.target.checked) onShow(card.id);
                      else onHide(card.id);
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">{name}</span>
                    <span className="block text-[var(--color-muted-foreground)]">{about}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
}
