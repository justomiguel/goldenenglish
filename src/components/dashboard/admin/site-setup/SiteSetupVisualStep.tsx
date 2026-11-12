"use client";

import { Palette } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import {
  designTokenIssueMessage,
  type DesignTokenIssueCopy,
} from "@/lib/design-tokens/designTokenIssueMessage";
import { FONT_CATALOG, isFontAllowedForTenant } from "@/lib/design-tokens/fontCatalog";
import type { SiteSetupOperationalValues } from "@/lib/site/loadSiteSetupCurrentValues";

type L = Dictionary["dashboard"]["siteSetup"]["visual"];

interface SiteSetupVisualStepProps {
  labels: L;
  operational: SiteSetupOperationalValues;
  tenantSlug: string | null;
  issue?: { code: string; token: string } | null;
  issueCopy?: DesignTokenIssueCopy;
  update: <K extends keyof SiteSetupOperationalValues>(
    key: K,
    value: SiteSetupOperationalValues[K],
  ) => void;
}

interface ColorRowProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function ColorRow({ id, label, value, onChange }: ColorRowProps) {
  const safeValue = /^#[0-9A-Fa-f]{3,8}$/.test(value) ? value : "#000000";
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <input
          id={`${id}-picker`}
          aria-label={label}
          type="color"
          className="h-10 w-12 cursor-pointer rounded border border-[var(--color-border)] bg-[var(--color-surface)]"
          value={safeValue}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
        />
        <Input
          id={id}
          className="flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

const selectClass =
  "mt-1 h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)]";

export function SiteSetupVisualStep({
  labels,
  operational,
  tenantSlug,
  issue = null,
  issueCopy,
  update,
}: SiteSetupVisualStepProps) {
  const fonts = FONT_CATALOG.filter((font) => isFontAllowedForTenant(font.id, tenantSlug));
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Palette
          className="h-5 w-5 text-[var(--color-primary)]"
          aria-hidden
        />
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          {labels.title}
        </h2>
      </div>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {labels.lead}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <ColorRow
          id="visual-primary"
          label={labels.colorPrimary}
          value={operational.visualPrimary}
          onChange={(v) => update("visualPrimary", v)}
        />
        <ColorRow
          id="visual-secondary"
          label={labels.colorSecondary}
          value={operational.visualSecondary}
          onChange={(v) => update("visualSecondary", v)}
        />
        <ColorRow
          id="visual-accent"
          label={labels.colorAccent}
          value={operational.visualAccent}
          onChange={(v) => update("visualAccent", v)}
        />
        <ColorRow
          id="visual-background"
          label={labels.colorBackground}
          value={operational.visualBackground}
          onChange={(v) => update("visualBackground", v)}
        />
        <ColorRow
          id="visual-surface"
          label={labels.colorSurface}
          value={operational.visualSurface}
          onChange={(v) => update("visualSurface", v)}
        />
      </div>

      {issue && issueCopy ? (
        <p role="alert" className="text-sm text-[var(--color-foreground)]">
          {designTokenIssueMessage(issue.code, issueCopy, { token: issue.token })}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="visual-font-heading">{labels.fontHeading}</Label>
          <select
            id="visual-font-heading"
            className={selectClass}
            value={operational.fontHeading}
            onChange={(e) => update("fontHeading", e.target.value)}
          >
            {fonts.map((font) => (
              <option key={font.id} value={font.id}>
                {font.family}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="visual-font-body">{labels.fontBody}</Label>
          <select
            id="visual-font-body"
            className={selectClass}
            value={operational.fontBody}
            onChange={(e) => update("fontBody", e.target.value)}
          >
            {fonts.map((font) => (
              <option key={font.id} value={font.id}>
                {font.family}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="visual-layout-max">{labels.layoutMaxWidth}</Label>
          <Input
            id="visual-layout-max"
            className="mt-1"
            value={operational.layoutMaxWidth}
            onChange={(e) => update("layoutMaxWidth", e.target.value)}
            placeholder="1280px"
          />
        </div>
        <div>
          <Label htmlFor="visual-layout-radius">
            {labels.layoutBorderRadius}
          </Label>
          <Input
            id="visual-layout-radius"
            className="mt-1"
            value={operational.layoutBorderRadius}
            onChange={(e) => update("layoutBorderRadius", e.target.value)}
            placeholder="0.75rem"
          />
        </div>
      </div>
    </div>
  );
}
