import { describe, expect, it } from "vitest";
import {
  applyEventEmailVars,
  eventEmailAllowsFlow,
  parseEventEmailLocale,
  pickEventEmailCopy,
  type EventEmailCopyRow,
} from "@/lib/events/eventEmailCopy";

const rows: EventEmailCopyRow[] = [
  {
    templateKey: "events.registered",
    locale: "es",
    flowId: null,
    subject: "Evento",
    bodyHtml: "<p>Evento {{firstName}}</p>",
  },
  {
    templateKey: "events.registered",
    locale: "es",
    flowId: "flow-1",
    subject: "Flujo",
    bodyHtml: "<p>Flujo {{firstName}}</p>",
  },
  {
    templateKey: "events.reminder",
    locale: "es",
    flowId: "flow-1",
    subject: "No debe usarse",
    bodyHtml: "<p>flujo</p>",
  },
  {
    templateKey: "events.reminder",
    locale: "es",
    flowId: null,
    subject: "Recordatorio",
    bodyHtml: "<p>evento</p>",
  },
];

describe("pickEventEmailCopy", () => {
  it("prefers the flow copy for a confirmation mail", () => {
    expect(
      pickEventEmailCopy(rows, {
        templateKey: "events.registered",
        locale: "es",
        flowId: "flow-1",
      })?.subject,
    ).toBe("Flujo");
  });

  it("uses the event copy when that flow has no row", () => {
    expect(
      pickEventEmailCopy(rows, {
        templateKey: "events.registered",
        locale: "es",
        flowId: "flow-missing",
      })?.subject,
    ).toBe("Evento");
  });

  it("returns null when the event has no copy", () => {
    expect(
      pickEventEmailCopy(rows, { templateKey: "events.payment_approved", locale: "es" }),
    ).toBeNull();
  });

  it("ignores a flow id for the reminder", () => {
    expect(
      pickEventEmailCopy(rows, {
        templateKey: "events.reminder",
        locale: "es",
        flowId: "flow-1",
      })?.subject,
    ).toBe("Recordatorio");
  });
});

describe("parseEventEmailLocale", () => {
  it("keeps en and pt and falls back to es", () => {
    expect(parseEventEmailLocale("en")).toBe("en");
    expect(parseEventEmailLocale("pt")).toBe("pt");
    expect(parseEventEmailLocale(null)).toBe("es");
    expect(parseEventEmailLocale("fr")).toBe("es");
  });
});

describe("eventEmailAllowsFlow", () => {
  it("allows only the two confirmation mails", () => {
    expect(eventEmailAllowsFlow("events.registered")).toBe(true);
    expect(eventEmailAllowsFlow("events.payment_approved")).toBe(true);
    expect(eventEmailAllowsFlow("events.payment_rejected")).toBe(false);
    expect(eventEmailAllowsFlow("events.registration_removed")).toBe(false);
  });
});

describe("applyEventEmailVars", () => {
  it("escapes html in variable values and leaves unknown tokens", () => {
    const filled = applyEventEmailVars(
      { subject: "Hola {{firstName}}", bodyHtml: "<p>{{firstName}} & {{missing}}</p>" },
      { firstName: `A<na> & "x"` },
    );
    expect(filled.subject).toBe("Hola A&lt;na&gt; &amp; &quot;x&quot;");
    expect(filled.bodyHtml).toBe("<p>A&lt;na&gt; &amp; &quot;x&quot; & {{missing}}</p>");
    const withReason = applyEventEmailVars(
      { subject: "Fuera", bodyHtml: "<p>{{reason}}</p>" },
      { reason: `<script>alert(1)</script>` },
    );
    expect(withReason.bodyHtml).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  });
});
