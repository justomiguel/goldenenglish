import { describe, it, expect } from "vitest";
import { resolveActiveDestination } from "@/lib/portal/resolveActiveDestination";
import type { PortalDestination } from "@/lib/portal/portalShellTypes";

const BASE = "/es/dashboard/parent";

const DESTINATIONS: PortalDestination[] = [
  { id: "home", href: BASE, label: "Inicio", icon: "home" },
  { id: "calendar", href: `${BASE}/calendar`, label: "Asistencias", icon: "calendar" },
  {
    id: "progress",
    href: `${BASE}/progress`,
    label: "Progreso",
    icon: "progress",
    matchPrefixes: [`${BASE}/tasks`, `${BASE}/badges`],
  },
  {
    id: "payments",
    href: `${BASE}/payments`,
    label: "Pagos",
    icon: "payments",
    matchPrefixes: [`${BASE}/billing`],
  },
];

describe("resolveActiveDestination", () => {
  it("matches the base path to home", () => {
    expect(resolveActiveDestination(BASE, DESTINATIONS)).toBe("home");
  });

  it("ignores a trailing slash on the base path", () => {
    expect(resolveActiveDestination(`${BASE}/`, DESTINATIONS)).toBe("home");
  });

  it("prefers the longest matching destination over the base", () => {
    expect(resolveActiveDestination(`${BASE}/calendar`, DESTINATIONS)).toBe("calendar");
  });

  it("matches nested paths under a destination", () => {
    expect(resolveActiveDestination(`${BASE}/payments/mp-return`, DESTINATIONS)).toBe("payments");
  });

  it("matches a declared legacy prefix", () => {
    expect(resolveActiveDestination(`${BASE}/tasks/abc-123`, DESTINATIONS)).toBe("progress");
    expect(resolveActiveDestination(`${BASE}/billing`, DESTINATIONS)).toBe("payments");
  });

  it("does not match a sibling that merely shares a string prefix", () => {
    expect(resolveActiveDestination(`${BASE}/calendarium`, DESTINATIONS)).toBe("home");
  });

  it("returns null when the path is outside the portal", () => {
    expect(resolveActiveDestination("/es/dashboard/admin", DESTINATIONS)).toBeNull();
  });
});
