import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildPublicSiteContactMessageHtml(input: {
  subjectFieldLabel: string;
  subjectLabel: string;
  bodyPlain: string;
  metaLines: { label: string; value: string }[];
}): string {
  const blocks: string[] = [];
  blocks.push(
    `<p><strong>${escapeHtmlText(input.subjectFieldLabel)}</strong> ${escapeHtmlText(input.subjectLabel)}</p>`,
  );
  for (const line of input.metaLines) {
    const v = line.value.trim();
    blocks.push(
      `<p><strong>${escapeHtmlText(line.label)}</strong> ${v ? escapeHtmlText(v) : "—"}</p>`,
    );
  }
  const body = input.bodyPlain.trim();
  const paras = body.length
    ? body.split(/\n{2,}/).map((chunk) => {
        const inner = chunk
          .split("\n")
          .map((ln) => escapeHtmlText(ln))
          .join("<br />");
        return `<p>${inner}</p>`;
      })
    : ["<p>—</p>"];
  blocks.push(`<hr />`, ...paras);
  return sanitizeMessageHtml(blocks.join(""));
}
