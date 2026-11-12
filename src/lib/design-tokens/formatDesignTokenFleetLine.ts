import type { DesignTokenIssue } from "@/lib/design-tokens/validateDesignTokens";

export function formatDesignTokenFleetLine(slug: string, issue: DesignTokenIssue): string {
  const pair = issue.pair ?? "-";
  const ratio = issue.ratio === undefined ? "-" : String(issue.ratio);
  return `${slug} ${issue.code} ${issue.token} ${pair} ${ratio}`;
}
