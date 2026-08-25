import type { AdminSurfaceIconId } from "@/lib/dashboard/adminSurfaceIcon";
import type { AdminPageHeaderArtFamily } from "@/lib/dashboard/adminPageHeaderArt";
import type { PortalDestination } from "@/lib/portal/portalShellTypes";

export type WorkplaceNavItem = {
  href: string;
  label: string;
  iconId: AdminSurfaceIconId;
  tip?: string;
  tourId?: string;
  exact?: boolean;
  matchPrefixes?: string[];
};

export type WorkplaceNavGroup = {
  label: string | null;
  items: WorkplaceNavItem[];
};

const PORTAL_ICON: Record<string, AdminSurfaceIconId> = {
  home: "home",
  child: "students",
  course: "academic",
  payments: "finance",
  messages: "messages",
  calendar: "calendar",
  progress: "academic",
};

export function portalDestinationIconId(id: string): AdminSurfaceIconId {
  return PORTAL_ICON[id] ?? "home";
}

export function workplaceNavGroupsFromDestinations(
  destinations: readonly PortalDestination[],
): WorkplaceNavGroup[] {
  return [
    {
      label: null,
      items: destinations.map((destination) => ({
        href: destination.href,
        label: destination.label,
        iconId: portalDestinationIconId(destination.id),
        exact: destination.id === "home",
        matchPrefixes: destination.matchPrefixes,
      })),
    },
  ];
}

export function portalPageArtFamily(
  role: "parent" | "student" | "assistant",
  iconId?: AdminSurfaceIconId,
): AdminPageHeaderArtFamily {
  if (iconId === "finance") return "finance";
  if (iconId === "messages") return "messages";
  if (iconId === "calendar") return "academic";
  if (role === "parent") return "parent";
  if (role === "student") return "student";
  return "staff";
}
