import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import {
  buildPulsarPanelNav,
  isPulsarPanelItemActive,
} from "@/lib/pulsar/pulsarPanelNav";

const dict = es as unknown as Dictionary;

// REGRESSION CHECK: Staff plantillas must stay after Analítica. Owner nav must stay free of that path.

describe("buildPulsarPanelNav", () => {
  it("lists staff tools and leaves public pages out", () => {
    const nav = buildPulsarPanelNav({ locale: "es", role: "staff", dict });
    expect(nav.panel.map((item) => item.href)).toEqual([
      "/es/admin?tab=sites",
      "/es/admin?tab=accounts",
      "/es/admin?tab=mail",
      "/es/admin?tab=analytics",
      "/es/admin/plantillas",
      "/es/admin/tenants/new",
      "/es/admin/perfil",
    ]);
    expect(nav.panel.find((item) => item.id === "templates")?.label).toBe(
      dict.pulsar.admin.templatesNav,
    );
    expect(nav.panel.some((item) => item.href.includes("/precios"))).toBe(false);
    expect(nav.panel.some((item) => item.href.includes("/soluciones"))).toBe(false);
  });

  it("lists owner tools", () => {
    const nav = buildPulsarPanelNav({ locale: "es", role: "owner", dict });
    expect(nav.panel.map((item) => [item.label, item.href])).toEqual([
      [dict.pulsar.account.homeTitle, "/es/cuenta"],
      [dict.pulsar.account.create, "/es/cuenta/nuevo"],
      [dict.pulsar.panelNav.messages, "/es/cuenta/mensajes"],
      [dict.pulsar.panelNav.account, "/es/cuenta/perfil"],
    ]);
  });
});

describe("isPulsarPanelItemActive", () => {
  const nav = buildPulsarPanelNav({ locale: "es", role: "staff", dict });
  const sites = nav.panel[0]!;
  const mail = nav.panel[2]!;
  const templates = nav.panel.find((item) => item.id === "templates")!;
  const created = nav.panel.find((item) => item.id === "new")!;

  it("marks the fleet tab that matches the URL", () => {
    expect(isPulsarPanelItemActive(sites, "/es/admin", null)).toBe(true);
    expect(isPulsarPanelItemActive(mail, "/es/admin", "mail")).toBe(true);
    expect(isPulsarPanelItemActive(sites, "/es/admin", "mail")).toBe(false);
    expect(isPulsarPanelItemActive(sites, "/es/admin/tenants/nago", null)).toBe(false);
    expect(isPulsarPanelItemActive(created, "/es/admin/tenants/new", null)).toBe(true);
    expect(isPulsarPanelItemActive(templates, "/es/admin/plantillas", null)).toBe(true);
    expect(isPulsarPanelItemActive(templates, "/es/admin", null)).toBe(false);
    expect(isPulsarPanelItemActive(sites, "/es/admin/plantillas", null)).toBe(false);
  });
});
