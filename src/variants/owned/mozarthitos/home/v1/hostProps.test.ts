import { describe, expect, it } from "vitest";
import { buildMozarthitosHomeProps } from "@/variants/owned/mozarthitos/home/v1/hostProps";

describe("buildMozarthitosHomeProps", () => {
  it("reads nav labels from the mz landing copy", () => {
    const props = buildMozarthitosHomeProps({
      dict: { landing: { mz: {} } } as never,
      brand: { name: "Mozarthitos", logoAlt: "Logo" } as never,
      locale: "es",
    });
    expect(props.labels.inicio).toBe("");
    expect(props.labels.cursos).toBe("");
    expect(props.eventsLabel).toBe("");
    expect(props.blogLabel).toBeUndefined();
    expect(props.blogEnabled).toBe(false);
    expect(props.locale).toBe("es");
  });
});
