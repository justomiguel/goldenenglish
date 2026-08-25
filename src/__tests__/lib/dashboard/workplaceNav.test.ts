import { describe, expect, it } from "vitest";
import {
  portalDestinationIconId,
  portalPageArtFamily,
  workplaceNavGroupsFromDestinations,
} from "@/lib/dashboard/workplaceNav";
import type { PortalDestination } from "@/lib/portal/portalShellTypes";

const DESTINATIONS: PortalDestination[] = [
  { id: "home", href: "/en/dashboard/parent", label: "Home", icon: "home" },
  {
    id: "child",
    href: "/en/dashboard/parent/child",
    label: "Child",
    icon: "progress",
    matchPrefixes: ["/en/dashboard/parent/tasks"],
  },
  { id: "payments", href: "/en/dashboard/parent/payments", label: "Pay", icon: "payments" },
  { id: "messages", href: "/en/dashboard/parent/messages", label: "Inbox", icon: "messages" },
];

describe("workplaceNav", () => {
  it("maps portal destinations to the admin icon language", () => {
    expect(portalDestinationIconId("home")).toBe("home");
    expect(portalDestinationIconId("child")).toBe("students");
    expect(portalDestinationIconId("course")).toBe("academic");
    expect(portalDestinationIconId("payments")).toBe("finance");
    expect(portalDestinationIconId("messages")).toBe("messages");
  });

  it("builds a single rail group with home exact and child prefixes", () => {
    const [group] = workplaceNavGroupsFromDestinations(DESTINATIONS);
    expect(group.items.map((item) => item.iconId)).toEqual([
      "home",
      "students",
      "finance",
      "messages",
    ]);
    expect(group.items[0].exact).toBe(true);
    expect(group.items[1].matchPrefixes).toEqual(["/en/dashboard/parent/tasks"]);
  });

  it("picks parent/student/staff cutouts unless finance or messages", () => {
    expect(portalPageArtFamily("parent", "home")).toBe("parent");
    expect(portalPageArtFamily("student", "academic")).toBe("student");
    expect(portalPageArtFamily("assistant", "academic")).toBe("staff");
    expect(portalPageArtFamily("parent", "finance")).toBe("finance");
    expect(portalPageArtFamily("student", "messages")).toBe("messages");
  });
});
