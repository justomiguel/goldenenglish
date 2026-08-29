import { describe, expect, it } from "vitest";
import { buildParentBulkEmailPlan } from "@/lib/parents/buildParentBulkEmailPlan";

const fromAddress = "instituto@example.com";

const parents = [
  {
    id: "p1",
    firstName: "Ana",
    lastName: "García",
    email: "ana@example.com",
  },
  {
    id: "p2",
    firstName: "Luis",
    lastName: "Pérez",
    email: null,
  },
  {
    id: "p3",
    firstName: "Mia",
    lastName: "Sol",
    email: "mia@example.com",
  },
];

describe("buildParentBulkEmailPlan", () => {
  it("always lists every parent for portal and skips synthetics on email", () => {
    const plan = buildParentBulkEmailPlan({
      parents,
      mode: "cc",
      subject: "Aviso",
      html: "<p>Hola</p>",
      fromAddress,
    });
    expect(plan.portalIds).toEqual(["p1", "p2", "p3"]);
    expect(plan.skippedSynthetic).toBe(1);
    expect(plan.emails).toHaveLength(1);
    expect(plan.emails[0]).toEqual({
      to: fromAddress,
      cc: ["ana@example.com", "mia@example.com"],
      subject: "Aviso",
      html: "<p>Hola</p>",
    });
  });

  it("puts deliverable emails on bcc", () => {
    const plan = buildParentBulkEmailPlan({
      parents,
      mode: "bcc",
      subject: "Aviso",
      html: "<p>Hola</p>",
      fromAddress,
    });
    expect(plan.emails[0]?.bcc).toEqual(["ana@example.com", "mia@example.com"]);
    expect(plan.emails[0]?.cc).toBeUndefined();
  });

  it("sends one personalized email per deliverable parent", () => {
    const plan = buildParentBulkEmailPlan({
      parents,
      mode: "individual",
      subject: "Hola {{nombre}}",
      html: "<p>{{apellido}}</p>",
      fromAddress,
    });
    expect(plan.emails).toEqual([
      { to: "ana@example.com", subject: "Hola Ana", html: "<p>García</p>" },
      { to: "mia@example.com", subject: "Hola Mia", html: "<p>Sol</p>" },
    ]);
  });

  it("returns no emails when every mailbox is synthetic", () => {
    const plan = buildParentBulkEmailPlan({
      parents: [{ id: "p2", firstName: "Luis", lastName: "Pérez", email: null }],
      mode: "cc",
      subject: "Aviso",
      html: "<p>Hola</p>",
      fromAddress,
    });
    expect(plan.emails).toEqual([]);
    expect(plan.portalIds).toEqual(["p2"]);
    expect(plan.skippedSynthetic).toBe(1);
  });
});
