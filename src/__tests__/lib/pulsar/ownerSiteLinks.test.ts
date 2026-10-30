import { describe, expect, it } from "vitest";
import { customHostBesidePreview, domainDnsRecord, previewSiteUrl } from "@/lib/pulsar/ownerSiteLinks";

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
});
