"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { mergeSiteThemePropertiesAction } from "@/app/[locale]/dashboard/admin/cms/siteThemeBasicsAction";
import { Button } from "@/components/atoms/Button";
import { landingHiddenValue } from "@/lib/theme/hiddenLandingSections";

const SECTIONS = ["historia", "oferta", "modalidades", "niveles", "certificaciones"] as const;

export interface GenericSiteBasicsFormProps {
  locale: string;
  themeId: string;
  properties: Readonly<Record<string, string>>;
  labels: {
    title: string;
    lead: string;
    seoTitle: string;
    seoDescription: string;
    hideSections: string;
    faviconMode: string;
    faviconImage: string;
    faviconLetter: string;
    save: string;
    saved: string;
  };
  sectionLabels: Record<(typeof SECTIONS)[number], string>;
}

export function GenericSiteBasicsForm({
  locale,
  themeId,
  properties,
  labels,
  sectionLabels,
}: GenericSiteBasicsFormProps) {
  const router = useRouter();
  const hidden = new Set((properties["app.landing.hidden"] ?? "").split(","));
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSaved(false);
    setError(false);
    const data = new FormData(event.currentTarget);
    const mode = String(data.get("faviconMode") ?? "image");
    const hiddenSections = SECTIONS.filter((section) => data.get(`show-${section}`) !== "on");
    const result = await mergeSiteThemePropertiesAction({
      id: themeId,
      locale,
      republishLetter: mode === "letter",
      patch: {
        "app.favicon.mode": mode,
        "app.landing.hidden": landingHiddenValue(hiddenSections),
        "app.seo.title": String(data.get("seoTitle") ?? ""),
        "app.seo.title.en": String(data.get("seoTitleEn") ?? ""),
        "app.seo.title.pt": String(data.get("seoTitlePt") ?? ""),
        "app.seo.description": String(data.get("seoDescription") ?? ""),
        "app.seo.description.en": String(data.get("seoDescriptionEn") ?? ""),
        "app.seo.description.pt": String(data.get("seoDescriptionPt") ?? ""),
      },
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
      <h2 className="text-lg font-medium">{labels.title}</h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">{labels.hideSections}</legend>
        {SECTIONS.map((section) => (
          <label key={section} className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name={`show-${section}`} defaultChecked={!hidden.has(section)} />
            {sectionLabels[section]}
          </label>
        ))}
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">{labels.faviconMode}</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="radio" name="faviconMode" value="image" defaultChecked={properties["app.favicon.mode"] !== "letter"} />
          {labels.faviconImage}
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="radio" name="faviconMode" value="letter" defaultChecked={properties["app.favicon.mode"] === "letter"} />
          {labels.faviconLetter}
        </label>
      </fieldset>
      <label className="block text-sm font-semibold" htmlFor="seo-title">
        {labels.seoTitle}
        <input id="seo-title" name="seoTitle" defaultValue={properties["app.seo.title"] ?? ""} className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </label>
      <label className="block text-sm font-semibold" htmlFor="seo-title-en">
        EN
        <input id="seo-title-en" name="seoTitleEn" defaultValue={properties["app.seo.title.en"] ?? ""} className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </label>
      <label className="block text-sm font-semibold" htmlFor="seo-title-pt">
        PT
        <input id="seo-title-pt" name="seoTitlePt" defaultValue={properties["app.seo.title.pt"] ?? ""} className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </label>
      <label className="block text-sm font-semibold" htmlFor="seo-description">
        {labels.seoDescription}
        <input id="seo-description" name="seoDescription" defaultValue={properties["app.seo.description"] ?? ""} className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </label>
      <label className="block text-sm font-semibold" htmlFor="seo-description-en">
        EN
        <input id="seo-description-en" name="seoDescriptionEn" defaultValue={properties["app.seo.description.en"] ?? ""} className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </label>
      <label className="block text-sm font-semibold" htmlFor="seo-description-pt">
        PT
        <input id="seo-description-pt" name="seoDescriptionPt" defaultValue={properties["app.seo.description.pt"] ?? ""} className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </label>
      {saved ? <p className="text-sm text-[var(--color-foreground)]">{labels.saved}</p> : null}
      {error ? <p className="text-sm text-[var(--color-error)]">{labels.lead}</p> : null}
      <Button type="submit" isLoading={pending}>
        <Save className="h-4 w-4" aria-hidden />
        {labels.save}
      </Button>
    </form>
  );
}
