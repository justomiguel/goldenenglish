import { escapeHtml } from "@/lib/academics/escapeHtml";

export interface ResolveMessagingDefaultReplyInput {
  template: string;
  instituteName: string;
  phone: string;
}

/**
 * Substitutes known placeholders, escapes HTML, wraps paragraphs for RichTextEditor.
 * Unknown `{{…}}` tokens are left as literal text (after escape of surrounding content —
 * braces themselves are not HTML-special).
 */
export function resolveMessagingDefaultReplyTemplate(
  input: ResolveMessagingDefaultReplyInput,
): string {
  const substituted = input.template
    .replaceAll("{{instituteName}}", input.instituteName)
    .replaceAll("{{phone}}", input.phone.trim());

  const paragraphs = substituted
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\n/g, " ").trim())
    .filter((block) => block.length > 0);

  if (paragraphs.length === 0) {
    return "<p></p>";
  }

  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}
