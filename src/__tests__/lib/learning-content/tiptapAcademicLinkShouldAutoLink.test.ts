import { describe, expect, it } from "vitest";
import { tiptapAcademicLinkShouldAutoLink } from "@/lib/learning-content/tiptapAcademicLinkShouldAutoLink";

describe("tiptapAcademicLinkShouldAutoLink", () => {
  it("allows https URLs", () => {
    expect(tiptapAcademicLinkShouldAutoLink("https://example.com/path")).toBe(true);
  });

  it("allows hostnames with dots", () => {
    expect(tiptapAcademicLinkShouldAutoLink("example.com")).toBe(true);
  });

  it("rejects bare IPv4", () => {
    expect(tiptapAcademicLinkShouldAutoLink("192.168.0.1")).toBe(false);
  });

  it("rejects hostnames without dots", () => {
    expect(tiptapAcademicLinkShouldAutoLink("localhost")).toBe(false);
  });
});
