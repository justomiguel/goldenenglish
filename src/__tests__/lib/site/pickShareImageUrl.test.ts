import { describe, expect, it } from "vitest";
import { pickShareImageUrl } from "@/lib/site/pickShareImageUrl";

describe("pickShareImageUrl", () => {
  it("uses the page photo first", () => {
    expect(pickShareImageUrl("/page.jpg", "/home.jpg", "/logo.png")).toBe("/page.jpg");
  });

  it("uses the home photo when the page has none", () => {
    expect(pickShareImageUrl("  ", "/home.jpg", "/logo.png")).toBe("/home.jpg");
  });

  it("uses the logo when no photo exists", () => {
    expect(pickShareImageUrl(null, null, "/logo.png")).toBe("/logo.png");
    expect(pickShareImageUrl(null, null, " ")).toBeNull();
  });
});
