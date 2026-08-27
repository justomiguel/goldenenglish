import { describe, expect, it } from "vitest";
import {
  isDarkPublicEventSurface,
  loadPublicEventSurfaceVariant,
  resolvePublicEventSurfaceVariant,
} from "@/lib/events/publicEventSurfaceVariant";
import {
  publicEventDescriptionProseClass,
  publicEventListPageHeaderClasses,
  publicEventRegisterPageClasses,
  publicEventRegisterShellClass,
} from "@/lib/events/publicEventSurfaceClasses";

describe("publicEventSurfaceVariant", () => {
  it("maps espaciozenit template to espaciozenit surface", () => {
    expect(resolvePublicEventSurfaceVariant("espaciozenit")).toBe("espaciozenit");
    expect(resolvePublicEventSurfaceVariant("classic")).toBe("default");
    expect(resolvePublicEventSurfaceVariant(undefined)).toBe("default");
  });

  it("maps nago template to nago surface", () => {
    expect(resolvePublicEventSurfaceVariant("nago")).toBe("nago");
  });

  it("treats nago and espaciozenit as dark public event chrome", () => {
    expect(isDarkPublicEventSurface("nago")).toBe(true);
    expect(isDarkPublicEventSurface("espaciozenit")).toBe(true);
    expect(isDarkPublicEventSurface("default")).toBe(false);
  });

  it("uses gold dark chrome on nago event descriptions and register", () => {
    expect(publicEventDescriptionProseClass("nago")).toContain("prose-invert");
    expect(publicEventDescriptionProseClass("nago")).toContain("nago-gold");
    expect(publicEventRegisterShellClass("nago")).toContain("bg-black");
    expect(publicEventRegisterShellClass("nago")).toContain("nago-gold");
    expect(publicEventRegisterPageClasses("nago").title).toContain("nago-heading-solid");
    expect(publicEventListPageHeaderClasses("nago").title).toContain("nago-heading-solid");
  });

  it("uses invert prose on espacio zenit event descriptions", () => {
    expect(publicEventDescriptionProseClass("espaciozenit")).toContain("prose-invert");
    expect(publicEventDescriptionProseClass("espaciozenit")).toContain("text-neutral-200");
    expect(publicEventDescriptionProseClass("default")).toContain("prose-neutral");
  });

  it("uses dark register shell for espacio zenit", () => {
    expect(publicEventRegisterShellClass("espaciozenit")).toContain("bg-black");
    expect(publicEventRegisterShellClass("espaciozenit")).not.toContain("color-surface");
    expect(publicEventRegisterPageClasses("espaciozenit").title).toContain("text-white");
  });
});

describe("loadPublicEventSurfaceVariant", () => {
  it("exports an async loader", () => {
    expect(typeof loadPublicEventSurfaceVariant).toBe("function");
  });
});
