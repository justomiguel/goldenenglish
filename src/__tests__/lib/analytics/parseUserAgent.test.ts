import { describe, expect, it } from "vitest";
import { parseTrafficUserAgent } from "@/lib/analytics/parseUserAgent";

describe("parseTrafficUserAgent", () => {
  it("returns 'empty' for null/undefined/whitespace", () => {
    expect(parseTrafficUserAgent(null).kind).toBe("empty");
    expect(parseTrafficUserAgent(undefined).kind).toBe("empty");
    expect(parseTrafficUserAgent("   ").kind).toBe("empty");
  });

  it("identifies Googlebot with vendor + info URL", () => {
    const ua =
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
    const r = parseTrafficUserAgent(ua);
    expect(r.kind).toBe("bot");
    expect(r.label).toBe("Googlebot");
    expect(r.vendor).toBe("Google");
    expect(r.vendorUrl).toMatch(/google\.com/);
    expect(r.secondary).toBe("search");
  });

  it("matches the more specific Googlebot variant before plain Googlebot", () => {
    const ua = "Googlebot-Image/1.0";
    const r = parseTrafficUserAgent(ua);
    expect(r.label).toBe("Googlebot Image");
    expect(r.vendor).toBe("Google");
  });

  it("identifies AI crawlers (GPTBot, ClaudeBot, PerplexityBot)", () => {
    expect(parseTrafficUserAgent("GPTBot/1.0").vendor).toBe("OpenAI");
    expect(parseTrafficUserAgent("ClaudeBot/1.0").vendor).toBe("Anthropic");
    expect(parseTrafficUserAgent("PerplexityBot/1.0").vendor).toBe("Perplexity");
  });

  it("identifies social link previews", () => {
    expect(parseTrafficUserAgent("facebookexternalhit/1.1").vendor).toBe("Meta");
    expect(parseTrafficUserAgent("Twitterbot/1.0").vendor).toBe("X");
    expect(parseTrafficUserAgent("WhatsApp/2.21").vendor).toBe("Meta");
  });

  it("flags generic 'spider' / 'crawler' UAs as bot without vendor", () => {
    const r = parseTrafficUserAgent("MyCustomCrawler/0.1 (+https://example.com)");
    expect(r.kind).toBe("bot");
    expect(r.vendor).toBeNull();
    expect(r.secondary).toBe("bot");
  });

  it("recognizes CLI / library clients", () => {
    expect(parseTrafficUserAgent("curl/8.4.0").kind).toBe("library");
    expect(parseTrafficUserAgent("python-requests/2.31.0").kind).toBe("library");
    expect(parseTrafficUserAgent("PostmanRuntime/7.36.0").kind).toBe("library");
  });

  it("parses Chrome on macOS desktop", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const r = parseTrafficUserAgent(ua);
    expect(r.kind).toBe("browser");
    expect(r.label).toBe("Chrome 120");
    expect(r.secondary).toContain("Desktop");
    expect(r.secondary).toContain("macOS");
  });

  it("parses Safari on iPhone as mobile iOS", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 " +
      "(KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";
    const r = parseTrafficUserAgent(ua);
    expect(r.kind).toBe("browser");
    expect(r.label).toMatch(/^Safari/);
    expect(r.secondary).toContain("Mobile");
    expect(r.secondary).toContain("iOS");
  });

  it("identifies Edge over Chrome (Edge UAs include both tokens)", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.61";
    const r = parseTrafficUserAgent(ua);
    expect(r.label).toBe("Edge 120");
    expect(r.secondary).toContain("Windows 10/11");
  });

  it("falls back to 'unknown' for opaque UAs", () => {
    const r = parseTrafficUserAgent("xxxxx");
    expect(r.kind).toBe("unknown");
    expect(r.label).toBe("xxxxx");
  });

  it("truncates very long unknown labels", () => {
    const r = parseTrafficUserAgent("x".repeat(200));
    expect(r.label.endsWith("…")).toBe(true);
    expect(r.label.length).toBeLessThanOrEqual(50);
  });
});
