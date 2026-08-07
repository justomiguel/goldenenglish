// REGRESSION CHECK: Missing or empty site_settings must fall back to per-locale factories.
import { describe, expect, it } from "vitest";
import { parseMessagingDefaultReplySetting } from "@/lib/messaging/parseMessagingDefaultReplySetting";
import {
  MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATES,
  pickMessagingDefaultReplyTemplate,
} from "@/lib/messaging/messagingDefaultReplyConstants";

const factories = MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATES;

describe("parseMessagingDefaultReplySetting", () => {
  it("returns factories for null/empty", () => {
    expect(parseMessagingDefaultReplySetting(null, factories)).toEqual(factories);
    expect(parseMessagingDefaultReplySetting("", factories)).toEqual(factories);
  });

  it("reads nested templates object", () => {
    expect(
      parseMessagingDefaultReplySetting(
        {
          templates: {
            es: " Hola {{instituteName}} ",
            en: "Hi {{instituteName}}",
            pt: "Olá {{instituteName}}",
          },
        },
        factories,
      ),
    ).toEqual({
      es: "Hola {{instituteName}}",
      en: "Hi {{instituteName}}",
      pt: "Olá {{instituteName}}",
    });
  });

  it("maps legacy single template to all locales", () => {
    expect(parseMessagingDefaultReplySetting({ template: "Plain {{phone}}" }, factories)).toEqual({
      es: "Plain {{phone}}",
      en: "Plain {{phone}}",
      pt: "Plain {{phone}}",
    });
  });
});

describe("pickMessagingDefaultReplyTemplate", () => {
  it("prefers the active locale then falls back to defaultLocale", () => {
    const templates = {
      es: "ES",
      en: "EN",
      pt: "",
    };
    expect(pickMessagingDefaultReplyTemplate(templates, "pt")).toBe("ES");
    expect(pickMessagingDefaultReplyTemplate(templates, "en")).toBe("EN");
  });
});
