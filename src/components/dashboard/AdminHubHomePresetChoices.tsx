"use client";

import { useState } from "react";
import { Briefcase, Check, LayoutGrid, RotateCcw, Rows3, Users } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { adminHomeCardLabel } from "@/lib/dashboard/adminHomeCardLabel";
import {
  visibleAdminHomeCards,
  type AdminHomeCardSize,
  type AdminHomeLayout,
  type AdminHomePresetId,
  type AdminHomeVisibility,
} from "@/lib/dashboard/adminHomeLayout";
import { applyAdminHomePreset } from "@/lib/dashboard/adminHomePresets";
import type { Dictionary } from "@/types/i18n";

const PRESETS: AdminHomePresetId[] = ["operations", "people", "compact", "reset"];

const SPAN: Record<AdminHomeCardSize, string> = {
  s: "col-span-4",
  m: "col-span-6",
  l: "col-span-8",
  full: "col-span-12",
};

export function AdminHubHomePresetChoices({
  labels,
  dict,
  draft,
  visibility,
  onApply,
}: {
  labels: Dictionary["admin"]["home"]["layout"];
  dict: Dictionary;
  draft: AdminHomeLayout;
  visibility: AdminHomeVisibility;
  onApply: (preset: AdminHomePresetId) => void;
}) {
  const [open, setOpen] = useState(false);
  const name: Record<AdminHomePresetId, string> = {
    operations: labels.presetOperations,
    people: labels.presetPeople,
    compact: labels.presetCompact,
    reset: labels.presetReset,
  };
  const hint: Record<AdminHomePresetId, string> = {
    operations: labels.presetOperationsHint,
    people: labels.presetPeopleHint,
    compact: labels.presetCompactHint,
    reset: labels.presetResetHint,
  };
  const draftKey = JSON.stringify(draft.items);

  return (
    <>
      <Button type="button" variant="secondary" size="sm" className="min-h-11" aria-expanded={open} onClick={() => setOpen(true)}>
        <LayoutGrid className="h-4 w-4" aria-hidden />
        {labels.presetsTitle}
      </Button>
      <Modal open={open} onOpenChange={setOpen} titleId="admin-home-presets" title={labels.presetsTitle}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PRESETS.map((preset) => {
            const layout = applyAdminHomePreset(preset, { shopEnabled: visibility.shopEnabled });
            const preview = visibleAdminHomeCards(layout, visibility).filter((card) => card.row < 2);
            const selected = JSON.stringify(layout.items) === draftKey;
            const Icon = preset === "operations" ? Briefcase : preset === "people" ? Users : preset === "compact" ? Rows3 : RotateCcw;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={selected}
                className={`flex min-h-11 flex-col gap-2 rounded-xl border p-2 text-left hover:border-[var(--color-primary)] ${
                  selected ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"
                } bg-[var(--color-surface)]`}
                onClick={() => {
                  onApply(preset);
                  setOpen(false);
                }}
              >
                <span className="grid grid-cols-12 gap-1 rounded-lg bg-[var(--color-muted)] p-1.5" aria-hidden>
                  {preview.map((card) => (
                    <span
                      key={card.id}
                      className={`truncate rounded-md bg-[var(--color-surface)] px-1.5 py-1 text-xs font-medium text-[var(--color-foreground)] shadow-[var(--shadow-card)] ${SPAN[card.size]}`}
                    >
                      {adminHomeCardLabel(card.id, dict)}
                    </span>
                  ))}
                </span>
                <span className="inline-flex items-center gap-2 px-1 text-sm font-semibold text-[var(--color-foreground)]">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{name[preset]}</span>
                  {selected ? <Check className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden /> : null}
                </span>
                <span className="sr-only">{hint[preset]}</span>
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
