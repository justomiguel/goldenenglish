"use client";

import { useState } from "react";
import { Check, Eye } from "lucide-react";
import { trackEvent } from "@/lib/analytics/trackClient";
import type { Dictionary } from "@/types/i18n";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import type { DraftOp, DraftScope } from "@/lib/theme-document/editorDraftOps";
import { themeDocumentIssueMessage } from "@/lib/theme-document/themeDocumentIssueMessage";

export type UpgradeLabels = Dictionary["admin"]["designEditor"]["upgrade"];

export type UpgradeTarget = {
  id: string;
  major: number;
  propsSchema: { safeParse: (value: unknown) => { success: true; data: unknown } | { success: false } };
  migrateProps?: (fromMajor: number, props: unknown) => unknown;
};

function migratedValue(section: ThemeSection, target: UpgradeTarget): unknown {
  return target.migrateProps ? target.migrateProps(section.major, section.props) : section.props;
}

export function UpgradeRow({
  scope,
  section,
  fleetCount,
  labels,
  issueMessages,
  target,
  onApply,
}: {
  scope: DraftScope;
  section: ThemeSection;
  fleetCount: number;
  labels: UpgradeLabels;
  issueMessages: Record<string, string>;
  target: UpgradeTarget;
  onApply: (op: DraftOp) => void;
}) {
  const [ready, setReady] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);

  function parsed() {
    return target.propsSchema.safeParse(migratedValue(section, target));
  }

  function preview() {
    const result = parsed();
    if (!result.success) {
      setReady(false);
      setIssue(themeDocumentIssueMessage(issueMessages, "upgrade_props_invalid"));
      return;
    }
    setIssue(null);
    setReady(true);
    trackEvent("click", "admin:theme-document", { action: "upgrade-preview" });
  }

  function apply() {
    const result = parsed();
    if (!result.success) {
      setReady(false);
      setIssue(themeDocumentIssueMessage(issueMessages, "upgrade_props_invalid"));
      return;
    }
    onApply({
      kind: "setVariant",
      scope,
      sectionId: section.id,
      variantId: target.id,
      major: target.major,
    });
    if (result.data && typeof result.data === "object" && !Array.isArray(result.data)) {
      for (const [field, value] of Object.entries(result.data as Record<string, unknown>)) {
        onApply({ kind: "setField", scope, sectionId: section.id, field, value });
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-[var(--color-foreground)]">{labels.fleet.replaceAll("{count}", String(fleetCount))}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-foreground)]"
          onClick={preview}
        >
          <Eye className="h-4 w-4" aria-hidden />
          {labels.preview}
        </button>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-foreground)]"
          onClick={apply}
        >
          <Check className="h-4 w-4" aria-hidden />
          {labels.apply}
        </button>
      </div>
      {ready ? <p className="text-sm text-[var(--color-foreground)]">{labels.ready}</p> : null}
      {issue ? (
        <p role="alert" className="text-sm text-[var(--color-foreground)]">
          {issue}
        </p>
      ) : null}
    </div>
  );
}
