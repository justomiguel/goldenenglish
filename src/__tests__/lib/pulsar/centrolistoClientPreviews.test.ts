// REGRESSION CHECK: Clientes only attach landing video/poster when those public files exist.
import { describe, expect, it } from "vitest";
import {
  attachClientPreviewMedia,
  centrolistoClientPreviewPaths,
  pickHomeClientPreviews,
} from "@/lib/pulsar/centrolistoClientPreviews";

describe("centrolistoClientPreviews", () => {
  it("builds public video and poster paths from the tenant slug", () => {
    expect(centrolistoClientPreviewPaths("golden")).toEqual({
      videoSrc: "/centrolisto/clients/golden.webm",
      posterSrc: "/centrolisto/clients/golden.jpg",
    });
  });

  it("attaches media and the bundled logo only for files that exist", () => {
    const existing = new Set([
      "/centrolisto/clients/golden.webm",
      "/centrolisto/clients/golden.jpg",
      "/centrolisto/clients/espaciozenit.jpg",
      "/images/golden/logo/1.png",
      "/images/nago/logo/logo.png",
    ]);
    const rows = attachClientPreviewMedia(
      [
        { slug: "golden", displayName: "Golden" },
        { slug: "espaciozenit", displayName: "Zenit" },
        { slug: "nago", displayName: "Nagô" },
      ],
      (publicPath) => existing.has(publicPath),
    );
    expect(rows[0]).toMatchObject({
      slug: "golden",
      previewVideoSrc: "/centrolisto/clients/golden.webm",
      previewPosterSrc: "/centrolisto/clients/golden.jpg",
      logoSrc: "/images/golden/logo/1.png",
    });
    expect(rows[1]).toMatchObject({
      slug: "espaciozenit",
      previewVideoSrc: undefined,
      previewPosterSrc: "/centrolisto/clients/espaciozenit.jpg",
      logoSrc: undefined,
    });
    expect(rows[2]).toMatchObject({
      slug: "nago",
      previewVideoSrc: undefined,
      previewPosterSrc: undefined,
      logoSrc: "/images/nago/logo/logo.png",
    });
  });

  it("picks two linked schools and puts media first", () => {
    const picked = pickHomeClientPreviews([
      { slug: "plain", publicUrl: "https://plain.example", hosts: [] },
      {
        slug: "golden",
        publicUrl: "https://golden.example",
        hosts: ["golden.example"],
        previewVideoSrc: "/centrolisto/clients/golden.webm",
      },
      { slug: "orphan", publicUrl: null, hosts: [] },
      {
        slug: "zenit",
        publicUrl: null,
        hosts: ["zenit.example"],
        previewPosterSrc: "/centrolisto/clients/espaciozenit.jpg",
      },
    ]);
    expect(picked.map((row) => row.slug)).toEqual(["golden", "zenit"]);
  });
});
