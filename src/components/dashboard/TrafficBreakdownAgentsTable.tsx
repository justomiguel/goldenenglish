"use client";

import { ExternalLink } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { TrafficVisitorKind } from "@/lib/dashboard/loadAdminTrafficKindBreakdowns";
import { parseTrafficUserAgent } from "@/lib/analytics/parseUserAgent";

interface TrafficBreakdownAgentsTableProps {
  labels: Dictionary["admin"]["analytics"];
  kind: TrafficVisitorKind;
  rows: { user_agent: string; cnt: number }[];
  nf: Intl.NumberFormat;
}

const CATEGORY_KEY_MAP: Record<string, keyof Dictionary["admin"]["analytics"]> = {
  search: "trafficUaCategorySearch",
  ai: "trafficUaCategoryAi",
  social: "trafficUaCategorySocial",
  seo: "trafficUaCategorySeo",
  monitor: "trafficUaCategoryMonitor",
  preview: "trafficUaCategoryPreview",
  feed: "trafficUaCategoryFeed",
  security: "trafficUaCategorySecurity",
  generic: "trafficUaCategoryGeneric",
  bot: "trafficUaCategoryGenericBot",
};

function localizeSecondary(
  secondary: string | null,
  labels: Dictionary["admin"]["analytics"],
): string | null {
  if (!secondary) return null;
  const key = CATEGORY_KEY_MAP[secondary];
  if (key) {
    const v = labels[key];
    if (typeof v === "string") return v;
  }
  return secondary;
}

/**
 * Top User-Agents panel: shows a friendly label (Googlebot, Chrome 120, …),
 * a small secondary line (vendor / category / OS), and a link to the official
 * vendor page when known. Bots tab uses different headers/empty copy.
 */
export function TrafficBreakdownAgentsTable({
  labels,
  kind,
  rows,
  nf,
}: TrafficBreakdownAgentsTableProps) {
  const isBots = kind === "bot";
  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <p className="text-sm font-semibold text-[var(--color-primary)]">
        {isBots ? labels.trafficBreakdownBotsTitle : labels.trafficBreakdownAgentsTitle}
      </p>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        {isBots ? labels.trafficBreakdownBotsHint : labels.trafficBreakdownAgentsHint}
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[18rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-foreground)]">
              <th scope="col" className="py-1.5 pr-3 font-medium">
                {labels.trafficBreakdownColAgent}
              </th>
              <th scope="col" className="py-1.5 text-end font-medium">
                {labels.trafficBreakdownColHits}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-6 text-center text-[var(--color-muted-foreground)]">
                  {isBots
                    ? labels.trafficBreakdownBotsEmpty
                    : labels.trafficBreakdownAgentsEmpty}
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const parsed = parseTrafficUserAgent(r.user_agent);
                const secondary = localizeSecondary(parsed.secondary, labels);
                const vendorBits: string[] = [];
                if (parsed.vendor) vendorBits.push(parsed.vendor);
                if (secondary) vendorBits.push(secondary);
                return (
                  <tr
                    key={`${r.user_agent}:${i}`}
                    className="border-b border-[var(--color-border)]/60"
                  >
                    <td className="py-1.5 pr-3" title={r.user_agent}>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-[var(--color-foreground)]">
                          <span className="truncate">{parsed.label}</span>
                          {parsed.vendorUrl ? (
                            <a
                              href={parsed.vendorUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-0.5 text-xs text-[var(--color-primary)] hover:underline"
                              aria-label={`${labels.trafficUaVendorLinkAria}: ${parsed.vendor ?? parsed.label}`}
                              title={labels.trafficUaVendorLinkAria}
                            >
                              <ExternalLink className="h-3 w-3" aria-hidden />
                            </a>
                          ) : null}
                        </p>
                        {vendorBits.length > 0 ? (
                          <p className="text-xs text-[var(--color-muted-foreground)]">
                            {vendorBits.join(" · ")}
                          </p>
                        ) : null}
                        <p className="mt-0.5 truncate font-mono text-[10px] text-[var(--color-muted-foreground)]/80">
                          {r.user_agent}
                        </p>
                      </div>
                    </td>
                    <td className="py-1.5 text-end align-top tabular-nums">{nf.format(r.cnt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
