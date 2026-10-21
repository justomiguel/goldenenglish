// REGRESSION CHECK: Factory order keeps payments before birthdays and before
// traffic so a new admin on a phone still sees urgent work first.
import { describe, expect, it } from "vitest";
import {
  factoryAdminHomeLayout,
  moveAdminHomeItem,
  readAdminHomeLayout,
  setAdminHomeItemHidden,
  setAdminHomeItemSize,
  visibleAdminHomeCards,
} from "@/lib/dashboard/adminHomeLayout";
import { applyAdminHomePreset } from "@/lib/dashboard/adminHomePresets";

const OPEN = {
  shopEnabled: true,
  checklistDone: true,
  studentsWithoutSection: 0,
  hasCurrentCohort: true,
};

describe("factoryAdminHomeLayout", () => {
  it("puts the three urgent cards before traffic and before birthdays", () => {
    const ids = factoryAdminHomeLayout({ shopEnabled: true }).items.map((item) => item.id);
    expect(ids.indexOf("payments")).toBeLessThan(ids.indexOf("traffic"));
    expect(ids.indexOf("registrations")).toBeLessThan(ids.indexOf("traffic"));
    expect(ids.indexOf("messages")).toBeLessThan(ids.indexOf("traffic"));
    expect(ids.indexOf("payments")).toBeLessThan(ids.indexOf("birthdays"));
    expect(ids.at(-1)).toBe("shortcuts");
  });

  it("omits shop orders when the shop is off", () => {
    const ids = factoryAdminHomeLayout({ shopEnabled: false }).items.map((item) => item.id);
    expect(ids).not.toContain("shopOrders");
  });
});

describe("visibleAdminHomeCards", () => {
  it("packs the three urgent cards on one row and wraps traffic when it does not fit", () => {
    const placed = visibleAdminHomeCards(factoryAdminHomeLayout({ shopEnabled: true }), OPEN);
    const payments = placed.find((card) => card.id === "payments");
    const registrations = placed.find((card) => card.id === "registrations");
    const messages = placed.find((card) => card.id === "messages");
    const traffic = placed.find((card) => card.id === "traffic");
    const shop = placed.find((card) => card.id === "shopOrders");
    expect(payments?.row).toBe(registrations?.row);
    expect(registrations?.row).toBe(messages?.row);
    expect(traffic?.columns).toBe(8);
    expect(shop?.row).toBe(traffic?.row);

    const wrapped = visibleAdminHomeCards(
      readAdminHomeLayout(
        {
          version: 1,
          items: [
            { id: "payments", size: "s", hidden: false },
            { id: "people", size: "s", hidden: false },
            { id: "traffic", size: "l", hidden: false },
          ],
        },
        { shopEnabled: false },
      ),
      OPEN,
    );
    expect(wrapped.find((card) => card.id === "traffic")?.row).toBe(
      (wrapped.find((card) => card.id === "payments")?.row ?? 0) + 1,
    );
  });

  it("skips a hidden card and does not leave its columns", () => {
    const layout = setAdminHomeItemHidden(
      factoryAdminHomeLayout({ shopEnabled: true }),
      "registrations",
      true,
    );
    const placed = visibleAdminHomeCards(layout, OPEN);
    expect(placed.map((card) => card.id)).not.toContain("registrations");
    const payments = placed.find((card) => card.id === "payments");
    const messages = placed.find((card) => card.id === "messages");
    expect(payments?.row).toBe(messages?.row);
  });

  it("skips the checklist when it is done and students-without-section when the count is 0", () => {
    const placed = visibleAdminHomeCards(factoryAdminHomeLayout({ shopEnabled: true }), OPEN);
    expect(placed.map((card) => card.id)).not.toContain("checklist");
    expect(placed.map((card) => card.id)).not.toContain("studentsWithoutSection");
  });

  it("raises a traffic size under the minimum to large", () => {
    const layout = setAdminHomeItemSize(
      factoryAdminHomeLayout({ shopEnabled: true }),
      "traffic",
      "s",
    );
    const traffic = visibleAdminHomeCards(layout, OPEN).find((card) => card.id === "traffic");
    expect(traffic?.size).toBe("l");
    expect(traffic?.columns).toBe(8);
  });
});

describe("readAdminHomeLayout", () => {
  it("drops an unknown id and appends a missing catalog card", () => {
    const layout = readAdminHomeLayout(
      {
        version: 1,
        items: [{ id: "retired", size: "s", hidden: false }, { id: "payments", size: "full", hidden: false }],
      },
      { shopEnabled: true },
    );
    expect(layout.items.map((item) => item.id)).not.toContain("retired");
    expect(layout.items[0]).toMatchObject({ id: "payments", size: "full" });
    expect(layout.items.map((item) => item.id)).toContain("birthdays");
    expect(layout.items.at(-1)?.id).not.toBe("payments");
  });

  it("drops shop orders when the shop is off", () => {
    const layout = readAdminHomeLayout(
      {
        version: 1,
        items: [{ id: "shopOrders", size: "s", hidden: false }],
      },
      { shopEnabled: false },
    );
    expect(layout.items.map((item) => item.id)).not.toContain("shopOrders");
  });
});

describe("presets and moves", () => {
  it("keeps checklist and students-without-section first on Operations", () => {
    const items = applyAdminHomePreset("operations", { shopEnabled: true }).items;
    const ids = items.map((item) => item.id);
    expect(ids[0]).toBe("checklist");
    expect(ids[1]).toBe("studentsWithoutSection");
    expect(ids.indexOf("payments")).toBeLessThan(ids.indexOf("people"));
    expect(items.find((item) => item.id === "payments")?.size).toBe("l");
    expect(items.find((item) => item.id === "registrations")?.size).toBe("m");
  });

  it("puts birthdays first and large on People", () => {
    const items = applyAdminHomePreset("people", { shopEnabled: true }).items;
    const ids = items.map((item) => item.id);
    expect(ids.indexOf("birthdays")).toBeLessThan(ids.indexOf("payments"));
    expect(items.find((item) => item.id === "birthdays")?.size).toBe("l");
    expect(items.find((item) => item.id === "people")?.size).toBe("m");
  });

  it("hides shortcuts on Compact", () => {
    const shortcuts = applyAdminHomePreset("compact", { shopEnabled: true }).items.find(
      (item) => item.id === "shortcuts",
    );
    expect(shortcuts?.hidden).toBe(true);
    expect(shortcuts?.size).toBe("s");
  });

  it("moves a card up one place and refuses to move the first card", () => {
    const layout = factoryAdminHomeLayout({ shopEnabled: false });
    const moved = moveAdminHomeItem(layout, "registrations", "up");
    const ids = moved.items.map((item) => item.id);
    expect(ids.indexOf("registrations")).toBe(ids.indexOf("payments") - 1);
    const stuck = moveAdminHomeItem(layout, "checklist", "up");
    expect(stuck.items.map((item) => item.id)).toEqual(layout.items.map((item) => item.id));
  });
});
