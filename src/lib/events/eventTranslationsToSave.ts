import { z } from "zod";
import type { EventLocale } from "@/lib/events/domain";

const EventTranslationSaveRowSchema = z.object({
  locale: z.enum(["es", "en", "pt"]),
  title: z.string().trim().max(200),
  description: z.string().max(500_000).nullish(),
  location: z.string().max(300).nullish(),
});

/** Accepts the editor payload, including locales whose location is null. */
export const SaveEventTranslationsInputSchema = z.object({
  adminLocale: z.string().min(2),
  eventId: z.string().uuid(),
  defaultLocale: z.enum(["es", "en", "pt"]),
  translations: z.array(EventTranslationSaveRowSchema).min(1),
});

export interface EventTranslationSaveInput {
  locale: EventLocale;
  title: string;
  description: string;
  location?: string | null;
}

export type EventTranslationsToSaveResult =
  | { ok: true; defaultRow: EventTranslationSaveInput; rows: EventTranslationSaveInput[] }
  | { ok: false; code: "default_title_required" };

const IMAGE_SRC = /<img\b[^>]*\bsrc=["'](https:\/\/[^"']+)["'][^>]*>/gi;

function imageSources(html: string): string[] {
  return [...html.matchAll(IMAGE_SRC)].map((match) => match[1]);
}

function appendMissingImages(description: string, extraHtml: string): string {
  const missing = imageSources(extraHtml).filter((src) => !description.includes(src));
  if (missing.length === 0) return description;
  const tags = missing.map((src) => `<p><img src="${src}" alt="" /></p>`).join("");
  return `${description}${tags}`;
}

/** Keeps the default-locale description (and its images) when other locale titles are blank. */
export function eventTranslationsToSave(
  rows: EventTranslationSaveInput[],
  defaultLocale: EventLocale,
): EventTranslationsToSaveResult {
  const defaultRow = rows.find((row) => row.locale === defaultLocale);
  const title = defaultRow?.title.trim() ?? "";
  if (!defaultRow || !title) return { ok: false, code: "default_title_required" };

  let description = defaultRow.description ?? "";
  for (const row of rows) {
    if (row.locale === defaultLocale || row.title.trim()) continue;
    description = appendMissingImages(description, row.description ?? "");
  }

  const savedDefault: EventTranslationSaveInput = {
    ...defaultRow,
    title,
    description,
  };
  const titledOthers = rows
    .filter((row) => row.locale !== defaultLocale && row.title.trim())
    .map((row) => ({ ...row, title: row.title.trim() }));

  return { ok: true, defaultRow: savedDefault, rows: [savedDefault, ...titledOthers] };
}
