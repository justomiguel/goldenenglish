"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PortalSubjectGroup } from "@/lib/portal/portalShellTypes";

export interface PortalSubjectChipsProps {
  groups: PortalSubjectGroup[];
  tourAnchor?: string;
}

export function PortalSubjectChips({ groups, tourAnchor }: PortalSubjectChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (groups.length === 0) return null;

  // Layouts never see `searchParams`, so `activeId` is only the server-side default;
  // the URL wins whenever it names an option this group actually offers.
  function activeIdFor(group: PortalSubjectGroup): string {
    const fromUrl = searchParams.get(group.param);
    if (fromUrl && group.options.some((option) => option.id === fromUrl)) return fromUrl;
    return group.activeId;
  }

  function select(group: PortalSubjectGroup, optionId: string) {
    if (optionId === activeIdFor(group)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set(group.param, optionId);
    // A different child has a different set of sections; let the server pick the first one.
    if (group.param === "studentId") params.delete("sectionId");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div
      {...(tourAnchor ? { "data-tour": tourAnchor } : {})}
      className="sticky top-[var(--portal-header-offset,3.5rem)] z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[var(--layout-max-width)] flex-col gap-1.5 px-4 py-2">
        {groups.map((group) => (
          <div
            key={group.param}
            role="group"
            aria-label={group.label}
            className="flex items-center gap-1.5 overflow-x-auto"
          >
            {group.options.map((option) => {
              const isActive = option.id === activeIdFor(group);
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => select(group, option.id)}
                  className={`min-h-[36px] shrink-0 rounded-full border px-3 text-xs font-semibold transition ${
                    isActive
                      ? "border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)] active:bg-[var(--color-muted)]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
