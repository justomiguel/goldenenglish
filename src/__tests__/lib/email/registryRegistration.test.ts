/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { listEmailTemplateDefinitions } from "@/lib/email/templates/templateRegistry";
import { REGISTRATION_EMAIL_KEYS } from "@/lib/email/templates/registryRegistration";

describe("registration email registry", () => {
  it("lists every registration key", () => {
    const keys = listEmailTemplateDefinitions().map((d) => d.key);
    for (const key of REGISTRATION_EMAIL_KEYS) {
      expect(keys).toContain(key);
    }
  });

  it("welcome includes portal access and password-change copy", () => {
    const welcome = listEmailTemplateDefinitions().find((d) => d.key === "registration.welcome");
    expect(welcome?.defaults.es.bodyHtml).toContain("{{inviteUrl}}");
    expect(welcome?.defaults.es.bodyHtml).toMatch(/contraseña/i);
  });

  it("keeps received copy in the tenant wrapper contract (payBlock placeholder)", () => {
    const received = listEmailTemplateDefinitions().find((d) => d.key === "registration.received");
    expect(received?.defaults.es.bodyHtml).toContain("{{payBlock}}");
    expect(received?.defaults.es.bodyHtml).toMatch(/cupos se pueden acabar/i);
  });
});
