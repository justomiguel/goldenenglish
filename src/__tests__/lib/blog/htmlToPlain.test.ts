import { describe, expect, it } from "vitest";
import { htmlToPlain } from "@/lib/blog/htmlToPlain";

describe("htmlToPlain", () => {
  it("removes html tags and script/style blocks", () => {
    const html =
      "<style>.x{}</style><p>Hello <strong>world</strong></p><script>alert(1)</script>";
    expect(htmlToPlain(html)).toBe("Hello world");
  });

  it("decodes common entities", () => {
    expect(htmlToPlain("<p>A &amp; B &lt; C</p>")).toBe("A & B < C");
  });
});
