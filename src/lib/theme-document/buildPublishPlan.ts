import { documentHash } from "@/lib/theme-document/canonicalDocument";
import { themeDocumentV1Schema, type ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { validateThemeDocument } from "@/lib/theme-document/validateThemeDocument";

export type ThemeDocumentPublish = (plan: {
  document: ThemeDocumentV1;
  hash: string;
}) => Promise<{ ok: true; version: number } | { ok: false; code: string }>;

export type PublishPlanResult =
  | { ok: true; hash: string; version: number | null }
  | { ok: false; code: string; path?: string };

export async function buildPublishPlan(input: {
  document: unknown;
  tenantSlug: string;
  dryRun: boolean;
  publish: ThemeDocumentPublish;
  write: (line: string) => void;
}): Promise<PublishPlanResult> {
  const parsed = themeDocumentV1Schema.safeParse(input.document);
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path.join(".");
    return path ? { ok: false, code: "variant_props_invalid", path } : { ok: false, code: "variant_props_invalid" };
  }
  const issues = validateThemeDocument(parsed.data, input.tenantSlug);
  if (!issues.ok) {
    const issue = issues.issues[0];
    return issue?.path
      ? { ok: false, code: issue.code, path: issue.path }
      : { ok: false, code: issue?.code ?? "token_missing" };
  }
  const hash = await documentHash(parsed.data);
  if (input.dryRun) {
    input.write(hash);
    return { ok: true, hash, version: null };
  }
  const published = await input.publish({ document: parsed.data, hash });
  if (!published.ok) return published;
  input.write(String(published.version));
  return { ok: true, hash, version: published.version };
}
