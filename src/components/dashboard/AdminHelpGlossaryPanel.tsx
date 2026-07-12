"use client";

import { useCallback, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  listAdminGlossaryGroups,
  termsByGlossaryGroup,
  type AdminGlossaryTermId,
} from "@/lib/admin-tutorials/glossary";
import { ADMIN_GLOSSARY_ICONS } from "@/lib/admin-tutorials/glossaryIcons";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import type { Dictionary } from "@/types/i18n";

export type AdminHelpGlossaryDict = Dictionary["dashboard"]["adminHelpGlossary"];

export interface AdminHelpGlossaryPanelProps {
  dict: AdminHelpGlossaryDict;
  /** `page` — full admin route; `compact` — help FAB panel (default). */
  layout?: "compact" | "page";
}

function termDomId(termId: AdminGlossaryTermId): string {
  return `admin-glossary-term-${termId}`;
}

export function AdminHelpGlossaryPanel({ dict, layout = "compact" }: AdminHelpGlossaryPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const scrollToTerm = useCallback((termId: AdminGlossaryTermId) => {
    const root = rootRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(`#${termDomId(termId)}`);
    if (!el) return;
    const details = el.closest("details");
    if (details && !details.open) {
      details.open = true;
    }
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  const groups = listAdminGlossaryGroups();
  const isPage = layout === "page";

  return (
    <div ref={rootRef} className={isPage ? "flex flex-col gap-6" : "flex flex-col gap-4"}>
      <section
        data-tour={isPage ? ADMIN_TOUR_ANCHORS.glossaryHierarchy : undefined}
        aria-labelledby="admin-glossary-hierarchy-title"
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 px-3 py-2.5"
      >
        <h3
          id="admin-glossary-hierarchy-title"
          className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]"
        >
          {dict.hierarchyTitle}
        </h3>
        <p className="mt-1.5 text-xs leading-snug text-[var(--color-foreground)]">
          {dict.hierarchyLead}
        </p>
        <ol
          className="mt-2 flex flex-col gap-1 text-xs text-[var(--color-muted-foreground)]"
          aria-label={dict.hierarchyStepsAria}
        >
          {dict.hierarchySteps.map((step, i) => (
            <li key={step} className="flex items-start gap-1.5">
              <span
                className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-semibold text-[var(--color-primary-foreground)]"
                aria-hidden
              >
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <div
        className="flex flex-col gap-5"
        aria-label={dict.listAria}
        data-tour={isPage ? ADMIN_TOUR_ANCHORS.glossaryGroups : undefined}
      >
        {groups.map((groupId) => {
          const groupLabel = dict.groups[groupId];
          const terms = termsByGlossaryGroup(groupId);
          return (
            <section key={groupId} aria-labelledby={`admin-glossary-group-${groupId}`}>
              <h3
                id={`admin-glossary-group-${groupId}`}
                className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]"
              >
                {groupLabel}
              </h3>
              <ul className={isPage ? "grid gap-2 sm:grid-cols-2" : "flex flex-col gap-2"}>
                {terms.map((entry) => {
                  const term = dict.terms[entry.dictKey];
                  const TermIcon = ADMIN_GLOSSARY_ICONS[entry.icon];
                  const related = entry.related ?? [];
                  return (
                    <li key={entry.id}>
                      <details className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                        <summary
                          id={termDomId(entry.id)}
                          className="flex cursor-pointer list-none items-start gap-2 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--color-muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
                        >
                          <TermIcon
                            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                            aria-hidden
                            strokeWidth={2}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="text-sm font-medium leading-snug text-[var(--color-foreground)]">
                                {term.title}
                              </span>
                              <ChevronRight
                                className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)] group-open:hidden"
                                aria-hidden
                              />
                              <ChevronDown
                                className="hidden h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)] group-open:inline"
                                aria-hidden
                              />
                            </span>
                            {term.aliases ? (
                              <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
                                {term.aliases}
                              </span>
                            ) : null}
                          </span>
                        </summary>
                        <div className="border-t border-[var(--color-border)] px-3 pb-3 pt-2 text-xs leading-relaxed text-[var(--color-foreground)] whitespace-pre-line">
                          <p>{term.body}</p>
                          {related.length > 0 ? (
                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                              <span className="text-[var(--color-muted-foreground)]">
                                {dict.relatedLabel}
                              </span>
                              {related.map((relId) => {
                                const relTitle = dict.terms[relId]?.title ?? relId;
                                return (
                                  <button
                                    key={relId}
                                    type="button"
                                    className="inline-flex min-h-[28px] items-center rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-2 py-0.5 text-[11px] font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                                    onClick={() => scrollToTerm(relId)}
                                  >
                                    {relTitle}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
