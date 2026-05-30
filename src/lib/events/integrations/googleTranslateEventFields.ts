import type { EventLocale } from "@/lib/events/domain";
import { googleTranslateText } from "@/lib/blog/integrations/google/googleTranslateText";
import { googleTranslateClient } from "@/lib/blog/integrations/google/googleTranslateClient";

export async function googleTranslateEventFields(input: {
  apiKey: string;
  sourceLocale: EventLocale;
  targetLocale: EventLocale;
  title: string;
  description: string;
  location?: string;
}): Promise<{ title: string; description: string; location: string | null }> {
  const location = input.location?.trim() ?? "";
  const [title, description, translatedLocation] = await Promise.all([
    googleTranslateText({
      apiKey: input.apiKey,
      sourceLocale: input.sourceLocale,
      targetLocale: input.targetLocale,
      text: input.title,
    }),
    input.description.trim()
      ? googleTranslateClient({
          apiKey: input.apiKey,
          sourceLocale: input.sourceLocale,
          targetLocale: input.targetLocale,
          html: input.description,
        }).then((result) => result.translatedHtml)
      : Promise.resolve(""),
    location
      ? googleTranslateText({
          apiKey: input.apiKey,
          sourceLocale: input.sourceLocale,
          targetLocale: input.targetLocale,
          text: location,
        })
      : Promise.resolve(""),
  ]);

  return {
    title,
    description,
    location: translatedLocation.trim() ? translatedLocation : null,
  };
}
