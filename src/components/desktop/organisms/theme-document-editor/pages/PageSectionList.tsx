"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { getVariant, variantsForTenant } from "@/lib/design-variants/variantRegistry";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import type { DraftOp, DraftScope } from "@/lib/theme-document/editorDraftOps";
import type { PagesLabels } from "./PagesTab";

function fill(template: string, section: string): string {
  return template.replaceAll("{section}", section);
}

export function PageSectionList({
  sections,
  scope,
  tenantSlug,
  orderLocked,
  labels,
  onApply,
}: {
  sections: readonly ThemeSection[];
  scope: DraftScope;
  tenantSlug: string | null;
  orderLocked: boolean;
  labels: PagesLabels;
  onApply: (op: DraftOp) => void;
}) {
  if (sections.length === 0) {
    return <p className="text-sm text-[var(--color-foreground)]">{labels.empty}</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {sections.map((section, index) => {
        const variant = getVariant(section.variantId, section.major);
        const choices = variant ? variantsForTenant(tenantSlug, variant.slot) : [];
        const selected = `${section.variantId}@${section.major}`;
        return (
          <li key={section.id} className="flex flex-col gap-2 border-b border-[var(--color-border)] pb-4">
            <p className="text-sm text-[var(--color-foreground)]">{section.id}</p>
            {orderLocked ? null : (
              <div className="flex gap-2">
                {index > 0 ? (
                  <button
                    type="button"
                    aria-label={fill(labels.moveUp, section.id)}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]"
                    onClick={() =>
                      onApply({ kind: "moveSection", scope, sectionId: section.id, toIndex: index - 1 })
                    }
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
                {index < sections.length - 1 ? (
                  <button
                    type="button"
                    aria-label={fill(labels.moveDown, section.id)}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]"
                    onClick={() =>
                      onApply({ kind: "moveSection", scope, sectionId: section.id, toIndex: index + 1 })
                    }
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </div>
            )}
            <select
              aria-label={fill(labels.variant, section.id)}
              className="min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)]"
              value={choices.some((choice) => `${choice.id}@${choice.major}` === selected) ? selected : ""}
              onChange={(event) => {
                const [variantId, majorText] = event.target.value.split("@");
                if (!variantId || !majorText) return;
                onApply({
                  kind: "setVariant",
                  scope,
                  sectionId: section.id,
                  variantId,
                  major: Number(majorText),
                });
              }}
            >
              {choices.map((choice) => (
                <option key={`${choice.id}@${choice.major}`} value={`${choice.id}@${choice.major}`}>
                  {choice.id}
                </option>
              ))}
            </select>
          </li>
        );
      })}
    </ul>
  );
}
