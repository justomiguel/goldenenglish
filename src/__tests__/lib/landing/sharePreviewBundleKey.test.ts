import { describe, expect, it } from "vitest";
import { sharePreviewBundleKeyFromTemplateKind } from "@/lib/landing/sharePreviewBundleKey";

describe("sharePreviewBundleKeyFromTemplateKind", () => {
  it("maps branded tenant landing kinds", () => {
    expect(sharePreviewBundleKeyFromTemplateKind("mozarthitos")).toBe(
      "mozarthitos",
    );
    expect(sharePreviewBundleKeyFromTemplateKind("espaciozenit")).toBe(
      "espaciozenit",
    );
    expect(sharePreviewBundleKeyFromTemplateKind("nago")).toBe("nago");
    expect(sharePreviewBundleKeyFromTemplateKind("mimundo")).toBe("mimundo");
  });

  it("maps classic, editorial and minimal to golden", () => {
    expect(sharePreviewBundleKeyFromTemplateKind("classic")).toBe("golden");
    expect(sharePreviewBundleKeyFromTemplateKind("editorial")).toBe("golden");
    expect(sharePreviewBundleKeyFromTemplateKind("minimal")).toBe("golden");
  });

  it("defaults to golden when kind is unknown or empty", () => {
    expect(sharePreviewBundleKeyFromTemplateKind(undefined)).toBe("golden");
    expect(sharePreviewBundleKeyFromTemplateKind(null)).toBe("golden");
    expect(sharePreviewBundleKeyFromTemplateKind("")).toBe("golden");
  });
});
