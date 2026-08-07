// REGRESSION CHECK: Default reply must escape brand/user text and only replace known placeholders.
import { describe, expect, it } from "vitest";
import { resolveMessagingDefaultReplyTemplate } from "@/lib/messaging/resolveMessagingDefaultReplyTemplate";
import { MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATE } from "@/lib/messaging/messagingDefaultReplyConstants";

describe("resolveMessagingDefaultReplyTemplate", () => {
  it("substitutes instituteName and phone into escaped HTML paragraphs", () => {
    const html = resolveMessagingDefaultReplyTemplate({
      template: "Thanks for contacting {{instituteName}}. Call {{phone}}.",
      instituteName: "Mozarthitos",
      phone: "+54 9 11 1234",
    });
    expect(html).toBe("<p>Thanks for contacting Mozarthitos. Call +54 9 11 1234.</p>");
  });

  it("escapes HTML in brand values and template text", () => {
    const html = resolveMessagingDefaultReplyTemplate({
      template: "Hi <b>{{instituteName}}</b> {{phone}}",
      instituteName: "<script>x</script>",
      phone: "1&2",
    });
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
    expect(html).toContain("1&amp;2");
    expect(html).toContain("&lt;b&gt;");
    expect(html).not.toContain("<script>");
  });

  it("leaves unknown placeholders unchanged", () => {
    const html = resolveMessagingDefaultReplyTemplate({
      template: "Hello {{unknown}} {{instituteName}}",
      instituteName: "GE",
      phone: "",
    });
    expect(html).toContain("{{unknown}}");
    expect(html).toContain("GE");
  });

  it("splits plain-text paragraphs on blank lines", () => {
    const html = resolveMessagingDefaultReplyTemplate({
      template: "Line one\n\nLine two",
      instituteName: "A",
      phone: "B",
    });
    expect(html).toBe("<p>Line one</p><p>Line two</p>");
  });

  it("resolves the factory template with brand values", () => {
    const html = resolveMessagingDefaultReplyTemplate({
      template: MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATE,
      instituteName: "Golden English",
      phone: "+54 9 3718 528-383",
    });
    expect(html).toContain("Golden English");
    expect(html).toContain("+54 9 3718 528-383");
    expect(html.startsWith("<p>")).toBe(true);
  });
});
