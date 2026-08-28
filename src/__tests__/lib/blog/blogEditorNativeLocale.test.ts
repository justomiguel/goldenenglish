import { describe, expect, it } from "vitest";
import { blogEditorNativeLocale } from "@/lib/blog/blogEditorNativeLocale";
import { defaultLocale } from "@/lib/i18n/dictionaries";

describe("blogEditorNativeLocale", () => {
  it("matches the system default locale", () => {
    expect(blogEditorNativeLocale()).toBe(defaultLocale);
    expect(blogEditorNativeLocale()).toBe("es");
  });
});
