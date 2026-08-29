import { describe, expect, it } from "vitest";
import { fillParentMailPlaceholders } from "@/lib/parents/fillParentMailPlaceholders";

describe("fillParentMailPlaceholders", () => {
  it("replaces nombre and apellido and leaves unknown tokens", () => {
    expect(
      fillParentMailPlaceholders("Hola {{nombre}} {{apellido}} {{otro}}", {
        firstName: "Ana",
        lastName: "García",
      }),
    ).toBe("Hola Ana García {{otro}}");
  });

  it("escapes HTML in names", () => {
    expect(
      fillParentMailPlaceholders("<p>{{nombre}}</p>", {
        firstName: '<img src=x onerror=alert(1)>',
        lastName: "O'Neil",
      }),
    ).toBe("<p>&lt;img src=x onerror=alert(1)&gt;</p>");
  });
});
