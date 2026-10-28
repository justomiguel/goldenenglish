import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { centrolistoLayoutIcons } from "@/lib/pulsar/centrolistoFavicon";

const FILES = [
  "public/centrolisto/favicon.ico",
  "public/centrolisto/favicon-16x16.png",
  "public/centrolisto/favicon-32x32.png",
  "public/centrolisto/apple-touch-icon.png",
  "public/centrolisto/android-chrome-192x192.png",
  "public/centrolisto/android-chrome-512x512.png",
];

describe("centrolisto favicon", () => {
  it("points the tab icon at the sage stroke and terracotta seed", () => {
    expect(centrolistoLayoutIcons()).toMatchObject({
      apple: "/centrolisto/apple-touch-icon.png",
      shortcut: "/centrolisto/favicon.ico",
    });
    const svg = readFileSync("public/centrolisto/mark.svg", "utf8");
    expect(svg).toContain("#2D5A47");
    expect(svg).toContain("#C87D55");
    for (const file of FILES) {
      expect(existsSync(file), file).toBe(true);
    }
  });
});
