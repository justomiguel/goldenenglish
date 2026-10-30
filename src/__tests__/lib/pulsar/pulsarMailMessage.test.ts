import { describe, expect, it } from "vitest";
import { clipMailDetail, pulsarMailMessage, renderPulsarMailHtml } from "@/lib/pulsar/pulsarMailMessage";

describe("pulsarMailMessage", () => {
  it("escapes the address and skips an empty recipient", () => {
    const message = pulsarMailMessage({
      to: "person@example.com",
      subject: "New account",
      body: "{email} asked for an account.",
      vars: { email: "a<b>@example.com" },
      locale: "es",
      brandName: "centrolisto",
    });
    expect(message?.html).toBe("<p>a&lt;b&gt;@example.com asked for an account.</p>");
    expect(pulsarMailMessage({
      to: "",
      subject: "New account",
      body: "Hello",
      vars: {},
      locale: "es",
      brandName: "centrolisto",
    })).toBeNull();
  });

  it("wraps every message in the mail shell with the CentroListo logo", () => {
    const html = renderPulsarMailHtml({
      bodyHtml: "<p>Hola</p>",
      locale: "es",
      origin: "https://centrolisto.cl",
      brandName: "centrolisto",
      contactEmail: "hola@centrolisto.cl",
    });
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("https://centrolisto.cl/centrolisto/apple-touch-icon.png");
    expect(html).toContain('width="56"');
    expect(html).toContain('height="56"');
    expect(html).toContain("<p>Hola</p>");
    expect(html).toContain("centrolisto");
  });

  it("removes a Resend key from a stored detail", () => {
    expect(clipMailDetail("bad key re_abc1234567 here")).toBe("bad key [key] here");
  });
});
