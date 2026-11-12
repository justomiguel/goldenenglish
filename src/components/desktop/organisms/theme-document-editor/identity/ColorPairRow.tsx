import { Lock } from "lucide-react";
import { contrastRatio } from "@/lib/theme/contrastRatio";
import type { DraftOp } from "@/lib/theme-document/editorDraftOps";
import type { IdentityLabels } from "@/components/desktop/organisms/theme-document-editor/identity/identityLabels";
import { LockedFieldNotice } from "@/components/desktop/organisms/theme-document-editor/LockedFieldNotice";

function fill(template: string, field: string): string {
  return template.replaceAll("{field}", field);
}

function fieldLabel(fields: IdentityLabels["fields"], token: string): string {
  const key = token.replace(/^color\./, "") as keyof IdentityLabels["fields"];
  return fields[key] ?? key;
}

function ColorControl({
  token,
  label,
  value,
  locked,
  showLock,
  openToAdmin,
  labels,
  onApply,
}: {
  token: string;
  label: string;
  value: string;
  locked: boolean;
  showLock: boolean;
  openToAdmin: boolean;
  labels: IdentityLabels;
  onApply: (op: DraftOp) => void;
}) {
  const lockPath = `tokens.color.${token}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="color"
        aria-label={fill(labels.color, label)}
        className="h-11 w-11"
        value={value}
        disabled={locked}
        onChange={(event) => onApply({ kind: "setToken", path: `color.${token}`, value: event.target.value })}
      />
      <input
        type="text"
        aria-label={fill(labels.hex, label)}
        className="min-h-[44px] w-28 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
        value={value}
        disabled={locked}
        onChange={(event) => onApply({ kind: "setToken", path: `color.${token}`, value: event.target.value })}
      />
      {locked ? <LockedFieldNotice text={fill(labels.locked, label)} /> : null}
      {showLock ? (
        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center"
          aria-label={fill(openToAdmin ? labels.unlock : labels.lock, label)}
          onClick={() => onApply({ kind: "setLock", path: lockPath, role: openToAdmin ? "staff" : "admin" })}
        >
          <Lock className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

export function ColorPairRow({
  leftToken,
  rightToken,
  leftValue,
  rightValue,
  min,
  labels,
  showLock,
  isLocked,
  editableBy,
  onApply,
}: {
  leftToken: string;
  rightToken: string;
  leftValue: string;
  rightValue: string;
  min: number;
  labels: IdentityLabels;
  showLock: boolean;
  isLocked: (path: string) => boolean;
  editableBy: Record<string, "staff" | "admin">;
  onApply: (op: DraftOp) => void;
}) {
  const leftKey = leftToken.replace(/^color\./, "");
  const rightKey = rightToken.replace(/^color\./, "");
  const leftLabel = fieldLabel(labels.fields, leftToken);
  const rightLabel = fieldLabel(labels.fields, rightToken);
  const ratio = Math.round(contrastRatio(leftValue, rightValue) * 100) / 100;
  return (
    <div role="group" aria-label={`${leftLabel} / ${rightLabel}`} className="flex flex-col gap-2 py-3">
      <p className="text-sm text-[var(--color-foreground)]">{`${leftLabel} / ${rightLabel}`}</p>
      <p className="text-sm text-[var(--color-foreground)]">{String(ratio)}</p>
      <p className="text-sm text-[var(--color-foreground)]">{ratio >= min ? labels.aaPass : labels.aaFail}</p>
      <ColorControl
        token={leftKey}
        label={leftLabel}
        value={leftValue}
        locked={isLocked(`tokens.color.${leftKey}`)}
        showLock={showLock}
        openToAdmin={editableBy[`tokens.color.${leftKey}`] === "admin"}
        labels={labels}
        onApply={onApply}
      />
      <ColorControl
        token={rightKey}
        label={rightLabel}
        value={rightValue}
        locked={isLocked(`tokens.color.${rightKey}`)}
        showLock={showLock}
        openToAdmin={editableBy[`tokens.color.${rightKey}`] === "admin"}
        labels={labels}
        onApply={onApply}
      />
    </div>
  );
}
