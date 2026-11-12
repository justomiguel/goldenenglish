import { describe, expect, it } from "vitest";
import { buildLioraHomeProps } from "@/variants/owned/liora/home/v1/hostProps";

describe("buildLioraHomeProps", () => {
  it("builds header labels and keeps the locale", () => {
    const props = buildLioraHomeProps({
      dict: { landing: { liora: {} } } as never,
      brand: { name: "Liora", logoPath: "/logo.png", logoAlt: "Liora" } as never,
      locale: "es",
      sessionEmail: null,
    });
    expect(props.labels.inicio).toBe("");
    expect(props.labels.clases).toBe("");
    expect(props.eventsLabel).toBe("");
    expect(props.blogLabel).toBeUndefined();
    expect(props.locale).toBe("es");
    expect(props.blogEnabled).toBe(false);
  });
});
