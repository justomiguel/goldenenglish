import { describe, expect, it } from "vitest";
import {
  resolveCountryFromIp,
  resolveRequestCountry,
} from "@/lib/analytics/geoCountryFromIp";

describe("resolveCountryFromIp", () => {
  it("returns null for empty / private / loopback inputs", () => {
    expect(resolveCountryFromIp(null)).toBeNull();
    expect(resolveCountryFromIp("")).toBeNull();
    expect(resolveCountryFromIp("   ")).toBeNull();
    expect(resolveCountryFromIp("::1")).toBeNull();
  });

  it("strips IPv4-mapped IPv6 prefix and resolves country", () => {
    expect(resolveCountryFromIp("::ffff:8.8.8.8")).toBe("US");
  });

  it("resolves a real public IPv4 to its country", () => {
    expect(resolveCountryFromIp("8.8.8.8")).toBe("US");
  });
});

describe("resolveRequestCountry", () => {
  it("prefers Vercel header when present", () => {
    expect(
      resolveRequestCountry({
        vercelCountry: "AR",
        cloudflareCountry: null,
        ip: "8.8.8.8",
      }),
    ).toBe("AR");
  });

  it("falls back to Cloudflare header", () => {
    expect(
      resolveRequestCountry({
        vercelCountry: null,
        cloudflareCountry: "br",
        ip: "8.8.8.8",
      }),
    ).toBe("BR");
  });

  it("falls back to IP lookup when no header is set", () => {
    expect(
      resolveRequestCountry({
        vercelCountry: null,
        cloudflareCountry: null,
        ip: "8.8.8.8",
      }),
    ).toBe("US");
  });

  it("ignores invalid header values and uses IP", () => {
    expect(
      resolveRequestCountry({
        vercelCountry: "X",
        cloudflareCountry: "USA",
        ip: "8.8.8.8",
      }),
    ).toBe("US");
  });

  it("returns null when nothing is available", () => {
    expect(
      resolveRequestCountry({
        vercelCountry: null,
        cloudflareCountry: null,
        ip: null,
      }),
    ).toBeNull();
  });
});
