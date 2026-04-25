/**
 * Whether the email template body is likely to lose markup in the WYSIWYG
 * editor (TipTap). Bodies with raw `<div>` wrappers are still valid email HTML
 * but are not first-class in the visual schema—default the admin to the code tab.
 */
export function emailTemplateBodyPrefersCodeEditor(bodyHtml: string): boolean {
  if (!bodyHtml.trim()) return false;
  return /<\s*div[\s>]/i.test(bodyHtml);
}
