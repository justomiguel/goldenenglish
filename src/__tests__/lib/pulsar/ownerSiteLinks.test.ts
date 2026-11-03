import { describe, expect, it } from "vitest";
import {
  customHostBesidePreview,
  domainDnsRecord,
  optionalOwnerDomain,
  previewSiteUrl,
} from "@/lib/pulsar/ownerSiteLinks";

describe("ownerSiteLinks", () => {
  it("keeps the custom host and builds the DNS record", () => {
    const preview = ["club.centrolisto.cl"];
    expect(customHostBesidePreview(["club.centrolisto.cl", "club.example.com"], preview)).toBe("club.example.com");
    expect(domainDnsRecord("club.example.com")).toEqual({
      kind: "cname",
      name: "club",
      target: "cname.vercel-dns.com",
    });
    expect(domainDnsRecord("example.com")).toEqual({
      kind: "a",
      name: "example.com",
      target: "76.76.21.21",
    });
    expect(domainDnsRecord("escuela.com.ar")?.kind).toBe("a");
    expect(domainDnsRecord("www.escuela.com.ar")?.kind).toBe("cname");
    expect(previewSiteUrl(preview)).toBe("https://club.centrolisto.cl");
    expect(customHostBesidePreview(["club.centrolisto.cl"], preview)).toBe("");
    expect(domainDnsRecord("localhost")).toBeNull();
    expect(previewSiteUrl([])).toBe("");
    expect(previewSiteUrl([""])).toBe("");
  });

  it("drops a platform host so the site still opens on the preview domain", () => {
    const isPlatform = (host: string) => host === "centrolisto.cl" || host === "www.centrolisto.cl";
    expect(optionalOwnerDomain("https://centrolisto.cl/inicio", isPlatform)).toBe("");
    expect(optionalOwnerDomain("www.centrolisto.cl", isPlatform)).toBe("");
    expect(optionalOwnerDomain("miinstituto.cl", isPlatform)).toBe("miinstituto.cl");
    expect(optionalOwnerDomain("  ", isPlatform)).toBe("");
  });
});
