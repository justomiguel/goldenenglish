import { describe, expect, it } from "vitest";
import { buildAdminMessageContactHrefs } from "@/lib/messaging/adminMessageContactLinks";
import {
  buildAdminMessageStatusStack,
  matchLatestStaffAnswer,
} from "@/lib/messaging/adminMessageStatus";
import { resolveContactWhatsAppDigits } from "@/lib/messaging/extractContactMetaPhone";

const parentId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("buildAdminMessageStatusStack", () => {
  it("shows unread when read_at is empty", () => {
    expect(
      buildAdminMessageStatusStack({ readAt: null, reply: null, followUps: [] }).map((l) => l.kind),
    ).toEqual(["unread"]);
  });

  it("shows read only when the message was read and nothing else happened", () => {
    expect(
      buildAdminMessageStatusStack({
        readAt: "2026-10-01T12:00:00.000Z",
        reply: null,
        followUps: [],
      }).map((l) => l.kind),
    ).toEqual(["read-only"]);
  });

  it("lists the email reply and the WhatsApp open, and omits read only", () => {
    const lines = buildAdminMessageStatusStack({
      readAt: "2026-10-01T12:00:00.000Z",
      reply: {
        kind: "email",
        actorName: "Pérez Ana",
        at: "2026-10-02T12:00:00.000Z",
        snippet: "Thanks",
      },
      followUps: [
        { channel: "whatsapp", actorName: "Gómez Luis", at: "2026-10-03T12:00:00.000Z" },
      ],
    });
    expect(lines.map((l) => l.kind)).toEqual(["email-reply", "follow-up"]);
    expect(lines[0]).toMatchObject({ actorName: "Pérez Ana", snippet: "Thanks" });
    expect(lines[1]).toMatchObject({ channel: "whatsapp", actorName: "Gómez Luis" });
  });

  it("keeps unread beside a portal reply", () => {
    const lines = buildAdminMessageStatusStack({
      readAt: "",
      reply: {
        kind: "portal",
        actorName: "Admin Ada",
        at: "2026-10-02T12:00:00.000Z",
        snippet: "Ok",
      },
      followUps: [],
    });
    expect(lines.map((l) => l.kind)).toEqual(["unread", "portal-reply"]);
  });
});

describe("matchLatestStaffAnswer", () => {
  it("picks the latest later portal reply from admin or teacher", () => {
    const match = matchLatestStaffAnswer({
      inboundId: "in",
      inboundSenderId: parentId,
      inboundCreatedAt: "2026-10-01T12:00:00.000Z",
      source: "internal",
      visitorEmail: null,
      candidates: [
        {
          id: "old",
          senderId: adminId,
          recipientId: parentId,
          createdAt: "2026-10-02T12:00:00.000Z",
          senderRole: "admin",
          senderName: "Admin Ada",
          bodyHtml: "<p>First</p>",
          visitorEmail: null,
        },
        {
          id: "new",
          senderId: "teacher",
          recipientId: parentId,
          createdAt: "2026-10-03T12:00:00.000Z",
          senderRole: "teacher",
          senderName: "Teacher Tina",
          bodyHtml: "<p>Second answer</p>",
          visitorEmail: null,
        },
      ],
    });
    expect(match).toMatchObject({ kind: "portal", actorName: "Teacher Tina", snippet: "Second answer" });
    expect(match?.html).toBeUndefined();
  });

  it("matches a site-contact email reply by visitor email", () => {
    const match = matchLatestStaffAnswer({
      inboundId: "in",
      inboundSenderId: "site",
      inboundCreatedAt: "2026-10-01T12:00:00.000Z",
      source: "contact_form",
      visitorEmail: "Ada@Example.test",
      includeHtml: true,
      candidates: [
        {
          id: "other",
          senderId: adminId,
          recipientId: "site",
          createdAt: "2026-10-04T12:00:00.000Z",
          senderRole: "admin",
          senderName: "Other",
          bodyHtml: "<p>Wrong visitor</p>",
          visitorEmail: "other@example.test",
        },
        {
          id: "hit",
          senderId: adminId,
          recipientId: "site",
          createdAt: "2026-10-02T12:00:00.000Z",
          senderRole: "admin",
          senderName: "Pérez Ana",
          bodyHtml: "<p>Sent mail</p>",
          visitorEmail: "ada@example.test",
        },
      ],
    });
    expect(match).toMatchObject({
      kind: "email",
      actorName: "Pérez Ana",
      snippet: "Sent mail",
      html: "<p>Sent mail</p>",
    });
  });
});

describe("contact targets", () => {
  it("reads the phone before the first hr and hides mail links when email is missing", () => {
    const html = "<p><strong>Tel</strong> +1 415 555 2671</p><hr /><p>Body +1 202 555 0143</p>";
    expect(resolveContactWhatsAppDigits(html, null)).toBe("14155552671");

    const hrefs = buildAdminMessageContactHrefs({
      email: "  ",
      whatsAppDigits: "14155552671",
      subject: "Re: Ada",
      body: "Hello there",
    });
    expect(hrefs.mailto).toBeNull();
    expect(hrefs.gmail).toBeNull();
    expect(hrefs.outlook).toBeNull();
    expect(hrefs.whatsapp).toBe("https://wa.me/14155552671?text=Hello+there");
  });

  it("builds mailto, Gmail, and Outlook with the same subject and body", () => {
    const hrefs = buildAdminMessageContactHrefs({
      email: "ada@example.test",
      whatsAppDigits: null,
      subject: "Re: Ada",
      body: "Hello there",
    });
    expect(hrefs.whatsapp).toBeNull();
    expect(hrefs.mailto).toContain("mailto:ada@example.test");
    expect(hrefs.mailto).toContain("subject=Re%3A+Ada");
    expect(hrefs.mailto).toContain("body=Hello+there");
    expect(hrefs.gmail).toContain("https://mail.google.com/mail/?");
    expect(hrefs.gmail).toContain("to=ada%40example.test");
    expect(hrefs.outlook).toContain("https://outlook.office.com/mail/deeplink/compose?");
    expect(hrefs.outlook).toContain("subject=Re%3A+Ada");
  });
});
