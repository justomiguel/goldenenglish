import { FONT_CATALOG, isFontAllowedForTenant } from "@/lib/design-tokens/fontCatalog";
import { HEADING_WEIGHTS, MOTION_LEVELS, SPACE_DENSITIES, TYPE_SCALES } from "@/lib/design-tokens/designTokensV1";
import { COLOR_CONTRAST_PAIRS } from "@/lib/design-tokens/validateDesignTokens";
import type { DraftOp } from "@/lib/theme-document/editorDraftOps";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import type { IdentityLabels } from "@/components/desktop/organisms/theme-document-editor/identity/identityLabels";
import { ColorPairRow } from "@/components/desktop/organisms/theme-document-editor/identity/ColorPairRow";
import { FontSelect } from "@/components/desktop/organisms/theme-document-editor/identity/FontSelect";
import { LevelSelect } from "@/components/desktop/organisms/theme-document-editor/identity/LevelSelect";

export interface IdentityTabProps {
  document: ThemeDocumentV1;
  tenantSlug: string | null;
  actorRole: "staff" | "admin";
  isLocked: (path: string) => boolean;
  onApply: (op: DraftOp) => void;
  labels: IdentityLabels;
}

function options(values: readonly string[], names: Record<string, string>) {
  return values.map((value) => ({ value, label: names[value] ?? value }));
}

export function IdentityTab({ document, tenantSlug, actorRole, isLocked, onApply, labels }: IdentityTabProps) {
  const fonts = FONT_CATALOG.filter((font) => isFontAllowedForTenant(font.id, tenantSlug));
  const showLock = actorRole === "staff";
  const color = document.tokens.color;
  return (
    <div className="flex flex-col gap-6">
      {COLOR_CONTRAST_PAIRS.map((pair) => (
        <ColorPairRow
          key={`${pair.token}:${pair.pair}`}
          leftToken={pair.token}
          rightToken={pair.pair}
          leftValue={color[pair.token.replace(/^color\./, "") as keyof typeof color]}
          rightValue={color[pair.pair.replace(/^color\./, "") as keyof typeof color]}
          min={pair.min}
          labels={labels}
          showLock={showLock}
          isLocked={isLocked}
          editableBy={document.editableBy}
          onApply={onApply}
        />
      ))}
      <FontSelect
        label={labels.headingFont}
        value={document.fontIds.heading}
        fonts={fonts}
        locked={isLocked("fontIds.heading")}
        onChange={(id) => onApply({ kind: "setFont", role: "heading", id })}
      />
      <FontSelect
        label={labels.bodyFont}
        value={document.fontIds.body}
        fonts={fonts}
        locked={isLocked("fontIds.body")}
        onChange={(id) => onApply({ kind: "setFont", role: "body", id })}
      />
      <LevelSelect
        label={labels.typeScale}
        value={document.tokens.type.scale}
        options={options(TYPE_SCALES, labels.scale)}
        locked={isLocked("tokens.type.scale")}
        onChange={(value) => onApply({ kind: "setToken", path: "type.scale", value })}
      />
      <LevelSelect
        label={labels.headingWeight}
        value={String(document.tokens.type.headingWeight)}
        options={HEADING_WEIGHTS.map((weight) => ({ value: String(weight), label: String(weight) }))}
        locked={isLocked("tokens.type.headingWeight")}
        onChange={(value) => onApply({ kind: "setToken", path: "type.headingWeight", value })}
      />
      <LevelSelect
        label={labels.density}
        value={document.tokens.space.density}
        options={options(SPACE_DENSITIES, labels.space)}
        locked={isLocked("tokens.space.density")}
        onChange={(value) => onApply({ kind: "setToken", path: "space.density", value })}
      />
      <LevelSelect
        label={labels.motion}
        value={document.tokens.motion.level}
        options={options(MOTION_LEVELS, labels.motionLevel)}
        locked={isLocked("tokens.motion.level")}
        onChange={(value) => onApply({ kind: "setToken", path: "motion.level", value })}
      />
      <label className="flex flex-col gap-1 text-sm text-[var(--color-foreground)]">
        <span>{labels.radiusControl}</span>
        <input
          aria-label={labels.radiusControl}
          className="min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
          value={document.tokens.radius.control}
          disabled={isLocked("tokens.radius.control")}
          onChange={(event) => onApply({ kind: "setToken", path: "radius.control", value: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-[var(--color-foreground)]">
        <span>{labels.radiusCard}</span>
        <input
          aria-label={labels.radiusCard}
          className="min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
          value={document.tokens.radius.card}
          disabled={isLocked("tokens.radius.card")}
          onChange={(event) => onApply({ kind: "setToken", path: "radius.card", value: event.target.value })}
        />
      </label>
    </div>
  );
}
