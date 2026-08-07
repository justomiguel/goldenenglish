"use client";

import type { Dictionary } from "@/types/i18n";
import type { ParentFocusCatalog, ResolvedParentFocus } from "@/lib/parent/parentFocusTypes";
import { resolveParentFocus } from "@/lib/parent/resolveParentFocus";
import { ParentFocusSwitcherDesktop } from "@/components/parent/ParentFocusSwitcherDesktop";
import { ParentFocusSwitcherPwa } from "@/components/parent/ParentFocusSwitcherPwa";
import { useSearchParams } from "next/navigation";

export type ParentFocusSwitcherVariant = "desktop-sidebar" | "pwa-home" | "pwa-sticky";

export interface ParentFocusSwitcherProps {
  catalog: ParentFocusCatalog;
  labels: Dictionary["dashboard"]["parent"]["focus"];
  variant: ParentFocusSwitcherVariant;
  /** Optional pre-resolved focus; when omitted, resolves from the URL. */
  focus?: ResolvedParentFocus;
}

export function ParentFocusSwitcher({
  catalog,
  labels,
  variant,
  focus: focusProp,
}: ParentFocusSwitcherProps) {
  const searchParams = useSearchParams();
  const focus =
    focusProp ??
    resolveParentFocus(catalog, {
      studentId: searchParams.get("studentId"),
      sectionId: searchParams.get("sectionId"),
    });

  if (catalog.students.length === 0) return null;

  if (variant === "desktop-sidebar") {
    return (
      <ParentFocusSwitcherDesktop catalog={catalog} focus={focus} labels={labels} />
    );
  }

  return (
    <ParentFocusSwitcherPwa
      catalog={catalog}
      focus={focus}
      labels={labels}
      variant={variant === "pwa-home" ? "home" : "sticky"}
    />
  );
}
