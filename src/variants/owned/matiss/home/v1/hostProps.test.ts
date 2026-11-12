import { describe, expect, it } from "vitest";
import { buildMatissHomeProps } from "@/variants/owned/matiss/home/v1/hostProps";

describe("buildMatissHomeProps", () => {
  it("builds the eight image slots and the studio links", () => {
    const props = buildMatissHomeProps({
      dict: { landing: { matiss: {} } } as never,
      brand: { name: "Matiss", logoPath: "/logo.png", logoAlt: "Matiss" } as never,
      locale: "es",
      sessionEmail: null,
      mediaMap: new Map(),
    });
    expect(props.images.gallery).toHaveLength(8);
    expect(props.images.programs).toHaveLength(3);
    expect(props.links.map((link) => link.href)).toContain("/es#horarios");
    expect(props.locale).toBe("es");
  });
});
