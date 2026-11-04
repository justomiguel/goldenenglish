"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Palette } from "lucide-react";
import { mergeSiteThemePropertiesAction } from "@/app/[locale]/dashboard/admin/cms/siteThemeBasicsAction";
import { Button } from "@/components/atoms/Button";
import type { GenericInstituteKind, GenericTemplatePalette } from "@/lib/theme/genericInstituteTemplates";
import { templatePaletteOverrides, templatePreviewHref } from "@/lib/theme/templatePalette";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["pulsar"]["account"];

export function GenericSiteColors({
  locale,
  themeId,
  kind,
  palette,
  labels,
}: {
  locale: string;
  themeId: string;
  kind: GenericInstituteKind;
  palette: GenericTemplatePalette;
  labels: Labels;
}) {
  const router = useRouter();
  const [primary, setPrimary] = useState(palette.primary);
  const [accent, setAccent] = useState(palette.accent);
  const [paper, setPaper] = useState(palette.paper);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const copy = labels.siteCopy;
  const preview = templatePreviewHref(locale, kind, { primary, accent, paper });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSaved(false);
    setError(false);
    const result = await mergeSiteThemePropertiesAction({
      id: themeId,
      locale,
      patch: templatePaletteOverrides({ primary, accent, paper }),
    });
    setPending(false);
    if (!result.ok) {
      setError(true);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-lg font-medium">{copy.colorsTitle}</h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.colorsLead}</p>
      <iframe title={copy.colorsTitle} src={preview} className="aspect-video w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)]" />
      <div className="grid gap-3 sm:grid-cols-3">
        <ColorField id={`${themeId}-primary`} label={labels.templateColorPrimary} value={primary} onChange={setPrimary} />
        <ColorField id={`${themeId}-accent`} label={labels.templateColorAccent} value={accent} onChange={setAccent} />
        <ColorField id={`${themeId}-paper`} label={labels.templateColorPaper} value={paper} onChange={setPaper} />
      </div>
      {saved ? <p className="text-sm">{copy.colorsSaved}</p> : null}
      {error ? <p className="text-sm text-[var(--color-error)]">{copy.colorsLead}</p> : null}
      <Button type="submit" isLoading={pending}>
        <Palette className="h-4 w-4" aria-hidden />
        {copy.colorsSave}
      </Button>
    </form>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold" htmlFor={id}>
      {label}
      <input
        id={id}
        type="color"
        value={value.toLowerCase()}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        className="mt-1 h-11 w-full cursor-pointer rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)]"
      />
    </label>
  );
}
