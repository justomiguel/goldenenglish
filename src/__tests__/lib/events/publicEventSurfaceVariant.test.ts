import { describe, expect, it } from "vitest";
import {
  loadPublicEventSurfaceVariant,
  resolvePublicEventSurfaceVariant,
} from "@/lib/events/publicEventSurfaceVariant";
import {
  publicEventDescriptionProseClass,
  publicEventRegisterPageClasses,
  publicEventRegisterShellClass,
} from "@/lib/events/publicEventSurfaceClasses";

describe("publicEventSurfaceVariant", () => {
  it("maps espaciozenit template to espaciozenit surface", () => {
    expect(resolvePublicEventSurfaceVariant("espaciozenit")).toBe("espaciozenit");
    expect(resolvePublicEventSurfaceVariant("classic")).toBe("default");
    expect(resolvePublicEventSurfaceVariant(undefined)).toBe("default");
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
