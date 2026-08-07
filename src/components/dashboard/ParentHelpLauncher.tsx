"use client";

import type { Dictionary } from "@/types/i18n";

export interface ParentHelpLauncherProps {
  locale: string;
  launcherDict: Dictionary["dashboard"]["parentHelpLauncher"];
  catalogDict: Dictionary["dashboard"]["parentHelpCatalog"];
  toursDict: Dictionary["dashboard"]["parentHelpTours"];
  explainScreenDict: Dictionary["dashboard"]["parentHelpExplainScreen"];
  screenToursDict: Dictionary["dashboard"]["parentHelpScreenTours"];
  /** First linked ward for task tours that need a child id. */
  defaultStudentId?: string;
}

/**
 * Parent Help FAB is intentionally disabled.
 * Product rule: Help FAB is admin + web-desktop only (never parent / PWA).
 */
export function ParentHelpLauncher(_props: ParentHelpLauncherProps) {
  return null;
}
