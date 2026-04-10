import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { LocaleFlag } from "@/components/atoms/LocaleFlag";

describe("LocaleFlag", () => {
  it("renders Spain flag for es", () => {
    const html = renderToString(<LocaleFlag locale="es" />);
    expect(html).toContain("#AA151B");
  });

  it("renders UK-style flag for en", () => {
    const html = renderToString(<LocaleFlag locale="en" />);
    expect(html).toContain("#012169");
  });
});
