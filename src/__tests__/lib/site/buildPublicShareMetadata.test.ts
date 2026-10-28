import { describe, expect, it } from "vitest";
import {
  buildPublicShareMetadata,
  toAbsoluteShareUrl,
} from "@/lib/site/buildPublicShareMetadata";

describe("buildPublicShareMetadata", () => {
  it("includes og:image when cover url is present", async () => {
    const prev = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    try {
      const meta = await buildPublicShareMetadata({
        title: "Workshop",
        description: "Join us",
        path: "/es/events/workshop",
        coverImageUrl: "https://cdn.example/cover.jpg",
      });
      expect(meta.openGraph?.images).toEqual([
        { url: "https://cdn.example/cover.jpg", alt: "Workshop" },
      ]);
      expect(meta.twitter?.card).toBe("summary_large_image");
      expect(meta.openGraph?.locale).toBeUndefined();
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = prev;
    }
  });

  it("defers image urls when route opengraph-image handles preview", async () => {
    const meta = await buildPublicShareMetadata({
      title: "Post",
      description: "Body",
      path: "/es/blog/post",
      coverImageUrl: "https://cdn.example/cover.jpg",
      deferShareImageToFileMetadata: true,
    });
    expect(meta.openGraph?.images).toBeUndefined();
    expect(meta.twitter?.images).toBeUndefined();
    expect(meta.twitter?.card).toBe("summary_large_image");
  });

  it("keeps an Open Graph locale when the caller passes one", async () => {
    const meta = await buildPublicShareMetadata({
      title: "Home",
      description: "Studio",
      path: "/es",
      locale: "es_CL",
    });
    expect(meta.openGraph?.locale).toBe("es_CL");
  });

  it("resolves site-relative fallback urls", async () => {
    const prev = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    try {
      expect(await toAbsoluteShareUrl("/images/logo.png")).toBe("https://example.com/images/logo.png");
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = prev;
    }
  });
});
