import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBlogArticleEditorLocales } from "@/hooks/useBlogArticleEditorLocales";
import { BLOG_LOCALES } from "@/lib/blog/domain";

describe("useBlogArticleEditorLocales", () => {
  it("syncMediaToAllLocales inserts media only into the native editing locale", () => {
    const { result } = renderHook(() =>
      useBlogArticleEditorLocales({
        startLocale: "es",
        seed: {
          es: { bodyHtml: "<p>Texto ES</p>" },
          en: { bodyHtml: "<p>Text EN</p>" },
          pt: { bodyHtml: "<p>Texto PT</p>" },
        },
      }),
    );

    const insertHtml =
      '<p><video controls preload="metadata" src="https://cdn.example/clip.mp4"></video></p>';

    act(() => {
      result.current.syncMediaToAllLocales({ insertHtml, blockIndex: 0 });
    });

    expect(result.current.bodyHtml).toContain("clip.mp4");

    for (const locale of BLOG_LOCALES) {
      if (locale === "es") continue;
      act(() => {
        result.current.switchEditingLocale(locale);
      });
      expect(result.current.bodyHtml).not.toContain("clip.mp4");
    }
  });
});
