"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Languages, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import {
  UnderlineTabBar,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import { EventDescriptionEditor } from "@/components/dashboard/admin/events/EventDescriptionEditor";
import { EVENT_LOCALES, type EventLocale, type EventTranslationRow } from "@/lib/events/domain";
import { applyMediaInsertToOtherEventDescriptions } from "@/lib/learning-content/insertRichEditorMediaAtBlockIndex";
import type { MediaSyncToAllLocalesPayload } from "@/lib/learning-content/insertAcademicEditorMedia";
import { mergeEventTranslations } from "@/lib/events/server/loadEventTranslations";
import {
  saveEventTranslationsAction,
  translateEventFieldsAdminAction,
} from "@/app/[locale]/dashboard/admin/events/translationActions";
import type { Dictionary } from "@/types/i18n";

type EditorLabels = Dictionary["admin"]["cms"]["blog"]["editor"];
type AcademicLabels = Dictionary["dashboard"]["adminContents"];

interface AdminEventTranslationsEditorLabels {
  sectionTitle: string;
  localeTabsAria: string;
  localeTab: Record<EventLocale, string>;
  titleLabel: string;
  descriptionLabel: string;
  locationLabel: string;
  save: string;
  translate: string;
  translateDisabled: string;
  savedOk: string;
  errorSave: string;
  errorTranslate: string;
  googleKeyMissing: string;
}

interface AdminEventTranslationsEditorProps {
  adminLocale: string;
  eventId: string;
  defaultLocale: EventLocale;
  initialTranslations: EventTranslationRow[];
  labels: AdminEventTranslationsEditorLabels;
  editorLabels: EditorLabels;
  academicLabels: AcademicLabels;
}

export function AdminEventTranslationsEditor({
  adminLocale,
  eventId,
  defaultLocale,
  initialTranslations,
  labels,
  editorLabels,
  academicLabels,
}: AdminEventTranslationsEditorProps) {
  const router = useRouter();
  const [activeLocale, setActiveLocale] = useState<EventLocale>(defaultLocale);
  const [draft, setDraft] = useState(() => mergeEventTranslations(initialTranslations));
  const [message, setMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tabItems: readonly UnderlineTabItem[] = useMemo(
    () =>
      EVENT_LOCALES.map((locale) => ({
        id: locale,
        label: draft[locale].title.trim() ? `${labels.localeTab[locale]} ✓` : labels.localeTab[locale],
        Icon: Globe,
      })),
    [draft, labels.localeTab],
  );

  const current = draft[activeLocale];

  function patchCurrent(patch: Partial<EventTranslationRow>) {
    setDraft((prev) => ({
      ...prev,
      [activeLocale]: { ...prev[activeLocale], ...patch },
    }));
  }

  function syncMediaToAllLocales({ insertHtml, blockIndex }: MediaSyncToAllLocalesPayload) {
    setDraft((prev) =>
      applyMediaInsertToOtherEventDescriptions(
        prev,
        EVENT_LOCALES,
        activeLocale,
        blockIndex,
        insertHtml,
      ),
    );
  }

  function saveAll() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveEventTranslationsAction({
        adminLocale,
        eventId,
        defaultLocale,
        translations: EVENT_LOCALES.map((locale) => draft[locale]),
      });
      if (!result.ok) {
        setMessage(labels.errorSave);
        return;
      }
      setMessage(labels.savedOk);
      router.refresh();
    });
  }

  function translateActive() {
    setMessage(null);
    const source = draft[defaultLocale];
    if (!source.title.trim()) return;

    startTransition(async () => {
      const result = await translateEventFieldsAdminAction({
        adminLocale,
        eventId,
        sourceLocale: defaultLocale,
        targetLocale: activeLocale,
        title: source.title,
        description: source.description,
        location: source.location ?? undefined,
      });
      if (!result.ok || !result.fields) {
        setMessage(result.message === "google_key_missing" ? labels.googleKeyMissing : labels.errorTranslate);
        return;
      }
      patchCurrent({
        title: result.fields.title,
        description: result.fields.description,
        location: result.fields.location,
      });
    });
  }

  return (
    <section className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.sectionTitle}</h3>
      <UnderlineTabBar
        idPrefix={`event-i18n-${eventId}`}
        ariaLabel={labels.localeTabsAria}
        items={tabItems}
        value={activeLocale}
        onChange={(id) => setActiveLocale(id as EventLocale)}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor={`event-i18n-title-${activeLocale}`}>{labels.titleLabel}</Label>
          <Input
            id={`event-i18n-title-${activeLocale}`}
            value={current.title}
            onChange={(e) => patchCurrent({ title: e.target.value })}
            disabled={pending}
            className="mt-1"
          />
        </div>
        <div className="md:col-span-2">
          <EventDescriptionEditor
            descriptionLabel={labels.descriptionLabel}
            editorLabels={editorLabels}
            academicLabels={academicLabels}
            eventId={eventId}
            descriptionHtml={current.description}
            onDescriptionHtmlChange={(html) => patchCurrent({ description: html })}
            syncMediaToAllLocales={syncMediaToAllLocales}
            onError={setUploadError}
            disabled={pending}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor={`event-i18n-location-${activeLocale}`}>{labels.locationLabel}</Label>
          <Input
            id={`event-i18n-location-${activeLocale}`}
            value={current.location ?? ""}
            onChange={(e) => patchCurrent({ location: e.target.value || null })}
            disabled={pending}
            className="mt-1"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={saveAll} isLoading={pending} disabled={pending}>
          {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {labels.save}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={translateActive}
          disabled={pending || activeLocale === defaultLocale}
          title={activeLocale === defaultLocale ? labels.translateDisabled : undefined}
        >
          <Languages className="h-4 w-4 shrink-0" aria-hidden />
          {labels.translate}
        </Button>
      </div>
      {uploadError ? <p className="text-sm text-[var(--color-error)]">{uploadError}</p> : null}
      {message ? <p className="text-sm text-[var(--color-muted-foreground)]">{message}</p> : null}
    </section>
  );
}
