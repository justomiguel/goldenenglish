/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  getEmailTemplateDefinition,
  isKnownEmailTemplateKey,
} from "@/lib/email/templates/templateRegistry";

const SHOP_EMAIL_KEYS = [
  "shop.guest_account_created",
  "shop.order_started",
  "shop.order_paid",
  "shop.order_ready",
] as const;

describe("shop email registry", () => {
  it("isKnownEmailTemplateKey accepts every shop key", () => {
    for (const key of SHOP_EMAIL_KEYS) {
      expect(isKnownEmailTemplateKey(key)).toBe(true);
    }
  });

  it("guest_account_created documents password, signInUrl, and orderUrl", () => {
    const names = (getEmailTemplateDefinition("shop.guest_account_created")?.placeholders ?? []).map(
      (p) => p.name,
    );
    expect(names).toEqual(expect.arrayContaining(["password", "signInUrl", "orderUrl"]));
  });

  it("order templates document orderUrl and pickupNote as needed", () => {
    expect(
      (getEmailTemplateDefinition("shop.order_started")?.placeholders ?? []).map((p) => p.name),
    ).toEqual(expect.arrayContaining(["orderUrl"]));
    expect(
      (getEmailTemplateDefinition("shop.order_paid")?.placeholders ?? []).map((p) => p.name),
    ).toEqual(expect.arrayContaining(["orderUrl", "pickupNote"]));
    expect(
      (getEmailTemplateDefinition("shop.order_ready")?.placeholders ?? []).map((p) => p.name),
    ).toEqual(expect.arrayContaining(["orderUrl", "pickupNote"]));
  });
});
