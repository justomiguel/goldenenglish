"use client";

import { Palette } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { SiteSetupOperationalValues } from "@/lib/site/loadSiteSetupCurrentValues";

type L = Dictionary["dashboard"]["siteSetup"]["visual"];

interface SiteSetupVisualStepProps {
  labels: L;
  operational: SiteSetupOperationalValues;
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

export function SiteSetupVisualStep({
  labels,
  operational,
  update,
}: SiteSetupVisualStepProps) {
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

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="visual-font-primary">{labels.fontPrimary}</Label>
          <Input
            id="visual-font-primary"
            className="mt-1"
            value={operational.fontPrimary}
            onChange={(e) => update("fontPrimary", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="visual-font-secondary">{labels.fontSecondary}</Label>
          <Input
            id="visual-font-secondary"
            className="mt-1"
            value={operational.fontSecondary}
            onChange={(e) => update("fontSecondary", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="visual-font-mono">{labels.fontMono}</Label>
          <Input
            id="visual-font-mono"
            className="mt-1"
            value={operational.fontMono}
            onChange={(e) => update("fontMono", e.target.value)}
          />
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
