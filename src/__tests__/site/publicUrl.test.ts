import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { absoluteUrl, getPublicSiteUrl } from "@/lib/site/publicUrl";

describe("getPublicSiteUrl", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("returns null when unset", () => {
    expect(getPublicSiteUrl()).toBeNull();
  });

  it("parses NEXT_PUBLIC_APP_URL and strips trailing slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com/";
    expect(getPublicSiteUrl()?.origin).toBe("https://example.com");
  });

  it("uses https VERCEL_URL when app url missing", () => {
    process.env.VERCEL_URL = "my-app.vercel.app";
    expect(getPublicSiteUrl()?.href).toBe("https://my-app.vercel.app/");
  });

  it("returns null when NEXT_PUBLIC_APP_URL is invalid", () => {
    process.env.NEXT_PUBLIC_APP_URL = "not a url";
    expect(getPublicSiteUrl()).toBeNull();
  });

  it("returns null when VERCEL_URL is invalid", () => {
    process.env.VERCEL_URL = "[";
    expect(getPublicSiteUrl()).toBeNull();
  });
});

describe("absoluteUrl", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it("returns null without base", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    expect(absoluteUrl("/en")).toBeNull();
  });

  it("joins path with base", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://site.com";
    expect(absoluteUrl("en/login")?.pathname).toBe("/en/login");
  });

  it("preserves absolute path when it already starts with slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://site.com";
    expect(absoluteUrl("/en/about")?.pathname).toBe("/en/about");
  });
});
