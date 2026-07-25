"use client";

import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  listAdminTutorialsByGroup,
  type AdminTutorialGroupId,
  type AdminTutorialId,
} from "@/lib/admin-tutorials/catalog";
import { ADMIN_TUTORIAL_CATALOG_ICONS } from "@/lib/admin-tutorials/tutorialCatalogIcons";
import type { Dictionary } from "@/types/i18n";

export type AdminHelpCatalogDict = Dictionary["dashboard"]["adminHelpCatalog"];
export type AdminHelpCatalogGroupsDict = Dictionary["dashboard"]["adminHelpCatalogGroups"];

export interface AdminHelpTutorialListProps {
  dict: AdminHelpCatalogDict;
  groupsDict: AdminHelpCatalogGroupsDict;
  onStart: (id: AdminTutorialId) => void;
  /** Only the active tutorial’s Play is busy; others stay clickable until a tour starts. */
  busyId?: AdminTutorialId | null;
}

function startAriaLabel(template: string, title: string): string {
  return template.replace(/\{\{\s*title\s*\}\}/g, title);
}

function groupHeading(groupsDict: AdminHelpCatalogGroupsDict, group: AdminTutorialGroupId): string {
  return groupsDict[group];
}

export function AdminHelpTutorialList({
  dict,
  groupsDict,
  onStart,
  busyId = null,
}: AdminHelpTutorialListProps) {
  const grouped = listAdminTutorialsByGroup();

  if (grouped.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>;
  }

  return (
    <div className="flex flex-col gap-5" aria-label={dict.listAria}>
      {grouped.map(({ group, tutorials }) => (
        <section key={group} aria-labelledby={`admin-help-group-${group}`}>
          <h3
            id={`admin-help-group-${group}`}
            className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]"
          >
            {groupHeading(groupsDict, group)}
          </h3>
          <ul className="flex flex-col gap-3">
            {tutorials.map((t) => {
              const entry = dict[t.catalogKey];
              const RowIcon = ADMIN_TUTORIAL_CATALOG_ICONS[t.icon];
              const rowBusy = busyId === t.id;
              const playLabel = startAriaLabel(dict.startCtaAria, entry.title);
              return (
                <li key={t.id} className="flex flex-col items-stretch gap-2" data-tutorial-id={t.id}>
                  <div className="max-w-[95%] rounded-2xl rounded-bl-md bg-[var(--color-muted)] px-3 py-2.5 text-[var(--color-foreground)]">
                    <div className="flex items-start gap-2">
                      <RowIcon
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                        aria-hidden
                        strokeWidth={2}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">{entry.title}</p>
                        <p className="mt-1 text-xs leading-snug text-[var(--color-muted-foreground)]">
                          {entry.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-[36px] rounded-full"
                      disabled={rowBusy || busyId !== null}
                      aria-label={playLabel}
                      onClick={() => onStart(t.id)}
                    >
                      {rowBusy ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                      ) : (
                        <Play className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      )}
                      {dict.startCta}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
