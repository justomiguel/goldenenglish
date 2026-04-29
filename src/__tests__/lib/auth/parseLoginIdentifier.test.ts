// REGRESSION CHECK: Initial coverage. Critical invariants:
//  - email-shaped input is routed to the standard email login path,
//  - DNI-shaped input is normalized (strip dots/spaces) and routed to lookup,
//  - empty / whitespace-only input is rejected before any side effect,
//  - inputs containing "@" but missing the email shape (e.g. "user@") fall
//    through to DNI so we never leak intent ambiguity into the email path.

import { describe, it, expect } from "vitest";
import { parseLoginIdentifier } from "@/lib/auth/parseLoginIdentifier";

describe("parseLoginIdentifier", () => {
  it("returns email for a valid email shape (lowercased + trimmed)", () => {
    expect(parseLoginIdentifier("  User@Example.com  ")).toEqual({
      kind: "email",
      value: "user@example.com",
    });
  });

  it("returns dni for a numeric document, stripping dots and whitespace", () => {
    expect(parseLoginIdentifier(" 12.345.678 ")).toEqual({
      kind: "dni",
      value: "12345678",
    });
  });

  it("returns dni for a short alphanumeric document", () => {
    expect(parseLoginIdentifier("AB1234")).toEqual({
      kind: "dni",
      value: "AB1234",
    });
  });

  it("returns invalid for whitespace-only input", () => {
    expect(parseLoginIdentifier("   ")).toEqual({ kind: "invalid" });
  });

  it("returns invalid for empty string", () => {
    expect(parseLoginIdentifier("")).toEqual({ kind: "invalid" });
  });

  it("falls through to dni when @-string is not a full email shape", () => {
    expect(parseLoginIdentifier("user@")).toEqual({
      kind: "dni",
      value: "user@",
    });
  });

  it("falls through to dni when missing TLD after @", () => {
    expect(parseLoginIdentifier("user@host")).toEqual({
      kind: "dni",
      value: "user@host",
    });
  });

  it("returns email when domain has TLD even with subdomain", () => {
    expect(parseLoginIdentifier("a.b@c.d.e")).toEqual({
      kind: "email",
      value: "a.b@c.d.e",
    });
  });
});
