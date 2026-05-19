"use client";

import type { Dictionary } from "@/types/i18n";
import { ParentRouteSurfaceGate } from "@/components/parent/ParentRouteSurfaceGate";
import { ParentSettingsScreen } from "@/components/parent/ParentSettingsScreen";

export interface ParentSettingsEntryProps {
  locale: string;
  labels: Dictionary["dashboard"]["parent"]["settings"];
  localeSwitcher: Dictionary["common"]["locale"];
}

export function ParentSettingsEntry(props: ParentSettingsEntryProps) {
  return (
    <ParentRouteSurfaceGate>
      <ParentSettingsScreen {...props} />
    </ParentRouteSurfaceGate>
  );
}
