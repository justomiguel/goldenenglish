"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type { Dictionary } from "@/types/i18n";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import type { DraftOp } from "@/lib/theme-document/editorDraftOps";
import { UpgradeRow, type UpgradeTarget } from "./UpgradeRow";
import type { UpgradeLabels } from "./UpgradeRow";

export type VersionRow = {
  id: string;
  version: number;
  publishedOn: string;
  author: string;
  documentHash: string;
};

type VersionLabels = Dictionary["admin"]["designEditor"]["versions"];

function fill(template: string, version: number): string {
  return template.replaceAll("{version}", String(version));
}

export function VersionsTab({
  rows,
  sections,
  actorRole,
  editableBy,
  latestMajorFor,
  findVariant,
  labels,
  upgradeLabels,
  fleetCountFor = () => 0,
  issueMessages = {},
  onApply = () => undefined,
  onRollback,
}: {
  rows: readonly VersionRow[];
  sections: readonly ThemeSection[];
  actorRole: "staff" | "admin";
  editableBy: Record<string, "staff" | "admin">;
  latestMajorFor: (variantId: string) => number | null;
  findVariant: (variantId: string, major: number) => UpgradeTarget | null;
  labels: VersionLabels;
  upgradeLabels: UpgradeLabels;
  fleetCountFor?: (variantId: string, major: number) => number;
  issueMessages?: Record<string, string>;
  onApply?: (op: DraftOp) => void;
  onRollback: (snapshotId: string) => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const canRollback = actorRole === "staff" || editableBy["publish.rollback"] === "admin";

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-foreground)]">
            <span>{row.version}</span>
            <span>{row.publishedOn}</span>
            <span>{row.author}</span>
            <span>{row.documentHash.slice(0, 8)}</span>
            {canRollback ? (
              <button
                type="button"
                aria-label={fill(labels.rollback, row.version)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border)]"
                onClick={() => setPendingId(row.id)}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {actorRole === "staff"
        ? sections.map((section) => {
            const next = latestMajorFor(section.variantId);
            if (next === null || next <= section.major) return null;
            const target = findVariant(section.variantId, next);
            if (!target) return null;
            return (
              <UpgradeRow
                key={section.id}
                scope="home"
                section={section}
                fleetCount={fleetCountFor(target.id, target.major)}
                labels={upgradeLabels}
                issueMessages={issueMessages}
                target={target}
                onApply={onApply}
              />
            );
          })
        : null}
      <ConfirmActionModal
        open={pendingId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingId(null);
        }}
        title={labels.confirmTitle}
        body={labels.confirmBody}
        cancelLabel={labels.cancel}
        confirmLabel={labels.confirm}
        onConfirm={() => {
          if (pendingId) onRollback(pendingId);
          setPendingId(null);
        }}
      />
    </div>
  );
}
