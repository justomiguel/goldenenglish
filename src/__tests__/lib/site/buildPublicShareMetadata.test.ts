import { describe, expect, it } from "vitest";
import {
  buildPublicShareMetadata,
  toAbsoluteShareUrl,
} from "@/lib/site/buildPublicShareMetadata";

describe("buildPublicShareMetadata", () => {
  it("includes og:image when cover url is present", () => {
    const prev = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    try {
      const meta = buildPublicShareMetadata({
        title: "Workshop",
        description: "Join us",
        path: "/es/events/workshop",
        coverImageUrl: "https://cdn.example/cover.jpg",
      });
      expect(meta.openGraph?.images).toEqual([
        { url: "https://cdn.example/cover.jpg", alt: "Workshop" },
      ]);
      expect(meta.twitter?.card).toBe("summary_large_image");
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = prev;
    }
  });

  it("resolves site-relative fallback urls", () => {
    const prev = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    try {
      expect(toAbsoluteShareUrl("/images/logo.png")).toBe("https://example.com/images/logo.png");
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = prev;
    }
  });
});
