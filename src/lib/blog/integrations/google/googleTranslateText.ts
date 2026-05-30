import type { BlogLocale } from "@/lib/blog/domain";
import { googleTranslateClient } from "@/lib/blog/integrations/google/googleTranslateClient";

const GOOGLE_TRANSLATE_URL =
  "https://translation.googleapis.com/language/translate/v2";

const LOCALE_MAP: Record<BlogLocale, string> = {
  en: "en",
  es: "es",
  pt: "pt",
};

export async function googleTranslateText(input: {
  apiKey: string;
  sourceLocale: BlogLocale;
  targetLocale: BlogLocale;
  text: string;
}): Promise<string> {
  const trimmed = input.text.trim();
  if (!trimmed) return trimmed;

  const response = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${input.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: trimmed,
      source: LOCALE_MAP[input.sourceLocale],
      target: LOCALE_MAP[input.targetLocale],
      format: "text",
    }),
    cache: "no-store",
  });

  if (!response.ok) return trimmed;

  const payload = (await response.json()) as {
    data?: { translations?: Array<{ translatedText?: string }> };
  };

  return payload.data?.translations?.[0]?.translatedText?.trim() ?? trimmed;
}

export async function googleTranslateBlogFields(input: {
  apiKey: string;
  sourceLocale: BlogLocale;
  targetLocale: BlogLocale;
  title: string;
  excerpt: string;
  bodyHtml: string;
}): Promise<{ title: string; excerpt: string; bodyHtml: string }> {
  const [title, excerpt, body] = await Promise.all([
    googleTranslateText({
      apiKey: input.apiKey,
      sourceLocale: input.sourceLocale,
      targetLocale: input.targetLocale,
      text: input.title,
    }),
    googleTranslateText({
      apiKey: input.apiKey,
      sourceLocale: input.sourceLocale,
      targetLocale: input.targetLocale,
      text: input.excerpt,
    }),
    googleTranslateClient({
      apiKey: input.apiKey,
      sourceLocale: input.sourceLocale,
      targetLocale: input.targetLocale,
      html: input.bodyHtml,
    }).then((result) => result.translatedHtml),
  ]);

  return { title, excerpt, bodyHtml: body };
}
