import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { shareCardPng } from "@/lib/brand/shareCardPng";
import {
  removeInstitutePublicImageDir,
  writeInstitutePublicImagePack,
} from "@/lib/tenant/institutePublicImagePack";

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
let root = "";

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  root = "";
});

describe("writeInstitutePublicImagePack", () => {
  it("writes Android, iPhone, and WhatsApp files from the admin upload", () => {
    root = mkdtempSync(path.join(tmpdir(), "ge-images-"));
    const pack = writeInstitutePublicImagePack({
      root,
      slug: "academia-sur",
      name: "Academia Sur",
      description: "Clases de la tarde",
      kind: "deportes",
      logo: { bytes: png, contentType: "image/png" },
    });

    expect(pack.faviconPath).toBe("/images/academia-sur/favicon.ico");
    expect(pack.sharePath).toBe("/images/academia-sur/og.png");
    expect(pack.logoPath).toBe("/images/academia-sur/logo.png");
    const dir = path.join(root, "public", "images", "academia-sur");
    expect(readFileSync(path.join(dir, "apple-touch-icon.png"))).toEqual(Buffer.from(png));
    expect(readFileSync(path.join(dir, "android-chrome-192x192.png"))).toEqual(Buffer.from(png));
    expect(readFileSync(path.join(dir, "android-chrome-512x512.png"))[0]).toBe(137);
    expect(readFileSync(path.join(dir, "og.png"))).toEqual(Buffer.from(png));
  });

  it("draws the name into the share card when there is no photo", () => {
    root = mkdtempSync(path.join(tmpdir(), "ge-images-"));
    const a = shareCardPng({
      name: "Alpha",
      description: "Morning group",
      ink: [0, 0, 0],
      paper: [255, 255, 255],
    });
    const b = shareCardPng({
      name: "Beta",
      description: "Morning group",
      ink: [0, 0, 0],
      paper: [255, 255, 255],
    });
    expect(Buffer.from(a.subarray(0, 8)).toString("hex")).toBe("89504e470d0a1a0a");
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);

    const pack = writeInstitutePublicImagePack({
      root,
      slug: "academia-sur",
      name: "Alpha",
      description: "Morning group",
      kind: "idiomas",
    });
    expect(pack.sharePath).toBe("/images/academia-sur/og.png");
    expect(readFileSync(path.join(root, "public/images/academia-sur/og.png"))[0]).toBe(137);
  });

  it("refuses a slug that leaves the images folder", () => {
    root = mkdtempSync(path.join(tmpdir(), "ge-images-"));
    expect(() =>
      removeInstitutePublicImageDir(root, "../secrets"),
    ).toThrow("invalid_slug");
  });
});
