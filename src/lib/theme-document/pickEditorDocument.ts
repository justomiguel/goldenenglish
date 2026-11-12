import { themeDocumentV1Schema, type ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";

export function pickEditorDocument(input: {
  draft: { document: unknown; documentHash: string | null } | null;
  published: unknown;
  legacy: ThemeDocumentV1;
}): { document: ThemeDocumentV1; baseHash: string | null } {
  const draft = input.draft ? themeDocumentV1Schema.safeParse(input.draft.document) : null;
  if (draft?.success) {
    return { document: draft.data, baseHash: input.draft?.documentHash ?? null };
  }
  const published = themeDocumentV1Schema.safeParse(input.published);
  if (published.success) return { document: published.data, baseHash: null };
  return { document: input.legacy, baseHash: null };
}
