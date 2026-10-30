import { parseCtaFields } from "@/lib/blog/ctaFields";
import type { BlogVisibility } from "@/lib/blog/articleVisibility";

export type NormalizeArticleWriteInput = {
  visibility: BlogVisibility;
  commentsEnabled: boolean;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
};

export type NormalizeArticleWriteResult =
  | {
      ok: true;
      visibility: BlogVisibility;
      comments_enabled: boolean;
      cta_label: string | null;
      cta_url: string | null;
    }
  | { ok: false; code: "cta_incomplete" | "cta_url" };

export function normalizeArticleWrite(
  input: NormalizeArticleWriteInput,
): NormalizeArticleWriteResult {
  const cta = parseCtaFields({ label: input.ctaLabel, url: input.ctaUrl });
  if (!cta.ok) return cta;
  return {
    ok: true,
    visibility: input.visibility,
    comments_enabled: input.commentsEnabled,
    cta_label: cta.label,
    cta_url: cta.url,
  };
}
