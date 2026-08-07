"use client";

import { useMemo, useState } from "react";
import { BadgeAchievementIconButton } from "@/components/molecules/BadgeAchievementIconButton";
import { BadgeAchievementDetailPanel } from "@/components/molecules/BadgeAchievementDetailPanel";
import { useAppSurface } from "@/hooks/useAppSurface";
import type { BadgeAchievementVisual } from "@/lib/badges/resolveBadgeAchievementVisual";
import type { StudentBadgeProgress } from "@/types/studentBadges";

export type ParentBadgeAchievementItem = {
  id: string;
  visual: BadgeAchievementVisual;
  categoryLabel: string;
  title: string;
  description?: string;
  statusLine: string;
  imageUrl?: string | null;
  locked: boolean;
  progress?: StudentBadgeProgress | null;
  progressDetail?: string;
  progressAriaLabel?: string;
};

export interface ParentBadgeAchievementsGridProps {
  items: ParentBadgeAchievementItem[];
  listAriaLabel: string;
  closeLabel: string;
}

export function ParentBadgeAchievementsGrid({
  items,
  listAriaLabel,
  closeLabel,
}: ParentBadgeAchievementsGridProps) {
  const surface = useAppSurface();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  return (
    <>
      <ul
        className="grid grid-cols-4 gap-3 sm:grid-cols-5 sm:gap-4 md:grid-cols-6 lg:grid-cols-8"
        aria-label={listAriaLabel}
      >
        {items.map((item) => (
          <li key={item.id} className="flex justify-center">
            <BadgeAchievementIconButton
              visual={item.visual}
              title={item.title}
              imageUrl={item.imageUrl}
              locked={item.locked}
              progressPercent={item.progress?.percent ?? null}
              selected={selectedId === item.id}
              onClick={() => setSelectedId(item.id)}
            />
          </li>
        ))}
      </ul>

      {selected ? (
        <BadgeAchievementDetailPanel
          open
          onOpenChange={(open) => {
            if (!open) setSelectedId(null);
          }}
          surface={surface}
          visual={selected.visual}
          categoryLabel={selected.categoryLabel}
          title={selected.title}
          description={selected.description}
          statusLine={selected.statusLine}
          imageUrl={selected.imageUrl}
          locked={selected.locked}
          progress={selected.progress}
          progressDetail={selected.progressDetail}
          progressAriaLabel={selected.progressAriaLabel}
          closeLabel={closeLabel}
        />
      ) : null}
    </>
  );
}
