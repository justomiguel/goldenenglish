import { logServerActionException } from "@/lib/logging/serverActionLog";
import type { BlogLocale } from "@/lib/blog/domain";
import type { BlogTranslateResult } from "@/lib/blog/translate/googleTranslateTypes";

const GOOGLE_TRANSLATE_URL =
  "https://translation.googleapis.com/language/translate/v2";

const LOCALE_MAP: Record<BlogLocale, string> = {
  en: "en",
  es: "es",
  pt: "pt",
};

interface GoogleTranslateInput {
  apiKey: string;
  sourceLocale: BlogLocale;
  targetLocale: BlogLocale;
  html: string;
}

export async function googleTranslateClient(
  input: GoogleTranslateInput,
): Promise<BlogTranslateResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${input.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: input.html,
        source: LOCALE_MAP[input.sourceLocale],
        target: LOCALE_MAP[input.targetLocale],
        format: "html",
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return { translatedHtml: input.html, translatedPlainText: input.html };
    }

    const payload = (await response.json()) as {
      data?: { translations?: Array<{ translatedText?: string }> };
    };

    const translatedHtml = payload.data?.translations?.[0]?.translatedText?.trim() ?? input.html;
    return {
      translatedHtml,
      translatedPlainText: translatedHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    };
  } catch (error) {
    logServerActionException("googleTranslateClient", error);
    return { translatedHtml: input.html, translatedPlainText: input.html };
  } finally {
    clearTimeout(timeout);
  }
}
