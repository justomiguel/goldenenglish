import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const absoluteUrlForRequest = vi.fn(async (path: string) => new URL(path, "https://centrolisto.cl"));

vi.mock("@/lib/site/requestPublicUrl", () => ({
  absoluteUrlForRequest: (path: string) => absoluteUrlForRequest(path),
}));

import { centrolistoShareMetadata } from "@/lib/pulsar/centrolistoShareMetadata";

describe("centrolistoShareMetadata", () => {
  beforeEach(() => {
    absoluteUrlForRequest.mockClear();
  });

  it("points WhatsApp at a 1200×630 card with an absolute URL", async () => {
    const png = readFileSync(join(process.cwd(), "public/centrolisto/og.png"));
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);

    const meta = await centrolistoShareMetadata({
      title: "El oficio detrás de la calma",
      description: "Un lugar propio para tu escuela.",
      siteName: "centrolisto",
      locale: "es",
      suffix: "/producto",
    });

    expect(meta.openGraph).toMatchObject({
      type: "website",
      url: "https://centrolisto.cl/es/producto",
      siteName: "centrolisto",
      title: "El oficio detrás de la calma",
      images: [
        {
          url: "https://centrolisto.cl/centrolisto/og.png",
          width: 1200,
          height: 630,
          alt: "centrolisto",
        },
      ],
    });
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["https://centrolisto.cl/centrolisto/og.png"],
    });
    expect(meta.alternates?.canonical).toBe("/es/producto");
  });

  it("names a private page once and keeps crawlers out", async () => {
    const { centrolistoPrivatePageMetadata } = await import("@/lib/pulsar/centrolistoShareMetadata");
    const meta = await centrolistoPrivatePageMetadata({
      locale: "es",
      title: "Crea tu cuenta",
      description: "Crea la página pública.",
      siteName: "centrolisto",
      suffix: "/cuenta/registro",
    });
    expect(meta.title).toEqual({ absolute: "Crea tu cuenta | CentroListo" });
    expect(meta.robots).toMatchObject({ index: false, follow: false });
    expect(meta.openGraph).toMatchObject({
      siteName: "CentroListo",
      title: "Crea tu cuenta | CentroListo",
    });
  });
});
