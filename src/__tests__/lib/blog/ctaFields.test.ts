// REGRESSION CHECK: Blog visibility, guest comments, and 30-day rates must stay aligned with the 2026-10-28 spec.
import { describe, expect, it } from "vitest";
import { parseCtaFields } from "@/lib/blog/ctaFields";

describe("parseCtaFields", () => {
  it("turns both empty strings into a null pair", () => {
    expect(parseCtaFields({ label: "", url: "" })).toEqual({
      ok: true,
      label: null,
      url: null,
    });
  });

  it("rejects a label when the url is empty", () => {
    expect(parseCtaFields({ label: "Join", url: "" })).toEqual({
      ok: false,
      code: "cta_incomplete",
    });
  });

  it("rejects a url when the label is empty", () => {
    expect(parseCtaFields({ label: "", url: "https://example.com/a" })).toEqual({
      ok: false,
      code: "cta_incomplete",
    });
  });

  it("rejects javascript urls", () => {
    expect(parseCtaFields({ label: "Open", url: "javascript:alert(1)" })).toEqual({
      ok: false,
      code: "cta_url",
    });
  });

  it("accepts https and site paths after trim", () => {
    expect(parseCtaFields({ label: "  Join  ", url: "  https://example.com/a  " })).toEqual({
      ok: true,
      label: "Join",
      url: "https://example.com/a",
    });
    expect(parseCtaFields({ label: "  Register  ", url: "  /register  " })).toEqual({
      ok: true,
      label: "Register",
      url: "/register",
    });
  });

  it("rejects a label longer than 80 characters", () => {
    expect(parseCtaFields({ label: "a".repeat(81), url: "https://example.com/a" })).toEqual({
      ok: false,
      code: "cta_incomplete",
    });
  });

  it("accepts a label of 80 characters and an http url", () => {
    expect(parseCtaFields({ label: "b".repeat(80), url: "http://example.com/a" })).toEqual({
      ok: true,
      label: "b".repeat(80),
      url: "http://example.com/a",
    });
  });

  it("rejects a protocol-relative url", () => {
    expect(parseCtaFields({ label: "Open", url: "//example.com/a" })).toEqual({
      ok: false,
      code: "cta_url",
    });
  });

  it("treats null and whitespace as an empty pair", () => {
    expect(parseCtaFields({ label: null, url: undefined })).toEqual({
      ok: true,
      label: null,
      url: null,
    });
    expect(parseCtaFields({ label: "   ", url: "  " })).toEqual({
      ok: true,
      label: null,
      url: null,
    });
  });
});
