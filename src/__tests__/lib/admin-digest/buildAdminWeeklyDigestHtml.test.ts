import { describe, expect, it } from "vitest";
import { digestChartSvgs } from "@/lib/admin-digest/adminWeeklyDigestCharts";
import { DIGEST_LABELS } from "@/lib/admin-digest/adminWeeklyDigestCopy";
import { buildAdminWeeklyDigestHtml } from "@/lib/admin-digest/buildAdminWeeklyDigestHtml";
import { digestFixture } from "@/__tests__/lib/admin-digest/digestFixture";
import type { AdminWeeklyDigest } from "@/lib/admin-digest/adminWeeklyDigestTypes";

const colors = {
  primary: "#103A5C",
  primaryLight: "#2A5B84",
  primaryDark: "#0A253D",
  foreground: "#FFFFFF",
  background: "#FAF9F6",
};

const links = {
  finance: "https://example.test/es/dashboard/admin/finance",
  messages: "https://example.test/es/dashboard/admin/messages",
  users: "https://example.test/es/dashboard/admin/users",
  home: "https://example.test/es/dashboard/admin",
};

function htmlFor(
  digest = digestFixture(),
  images: { cobro: string | null } = { cobro: "cid:cobro" },
  extra: { prior?: AdminWeeklyDigest | null; logoUrl?: string | null } = {},
) {
  return buildAdminWeeklyDigestHtml({
    digest,
    prior: extra.prior ?? null,
    labels: DIGEST_LABELS.es,
    colors,
    links,
    instituteName: "Instituto",
    weekLabel: "19–25 oct",
    logoUrl: extra.logoUrl ?? null,
    legalLine: "Instituto",
    images: { cobro: images.cobro, parents: null, weekday: null, aula: null },
    money: (amount) => `$${amount}`,
  });
}

describe("admin weekly digest mail", () => {
  it("paints the tuition chart with the institute primary color", () => {
    const charts = digestChartSvgs(digestFixture(), colors);
    expect(charts.cobro).toContain('stroke="#103A5C"');
  });

  it("shows the three waiting counts, the parent percent, and the urgent subject", () => {
    const mail = htmlFor();
    expect(mail.subject).toBe("4 comprobantes sin revisar");
    expect(mail.html).toContain("4 comprobantes sin revisar");
    expect(mail.html).toContain("2 mensajes sin respuesta");
    expect(mail.html).toContain("11 familias en silencio");
    expect(mail.html).toContain("62% de los padres inició sesión.");
    expect(mail.html).not.toContain("@");
  });

  it("still shows zero counts on a quiet week", () => {
    const mail = htmlFor(
      digestFixture({ pendingReceipts: 0, openParentMessages: 0, silentFamilies: 0 }),
    );
    expect(mail.html).toContain("0 comprobantes sin revisar");
    expect(mail.html).toContain("No hay nada en espera.");
  });

  it("keeps the numbers when the chart image is missing", () => {
    const mail = htmlFor(digestFixture(), { cobro: null });
    expect(mail.html).not.toContain("cid:cobro");
    expect(mail.html).toContain("71% cobrado.");
  });

  it("shows the paid drop, the parent rise, the logo, and the empty classroom", () => {
    const current = digestFixture({ attendanceSections: 0, tasksDue: 0 });
    const prior = digestFixture({
      parentPercent: 40,
      tuition: { ...current.tuition, paidCount: 120, invoiceCount: 120 },
    });
    const mail = htmlFor(current, { cobro: "cid:cobro" }, { prior, logoUrl: "https://example.test/logo.png" });
    expect(mail.html).toContain("https://example.test/logo.png");
    expect(mail.html).toContain("No hay secciones activas para medir asistencia.");
    expect(mail.html).toContain("No hubo tareas con vencimiento.");
    expect(mail.html).toContain("-29");
    expect(mail.html).toContain("+22");
  });

  it("omits the delta when the prior week matches", () => {
    const digest = digestFixture();
    const mail = htmlFor(digest, { cobro: null }, { prior: digest });
    expect(mail.html).not.toContain("+0");
    expect(mail.html).not.toContain("-0");
  });

  it("shows 0% when the month has no invoices", () => {
    const mail = htmlFor(
      digestFixture({
        tuition: {
          invoiceCount: 0,
          paidCount: 0,
          pendingCount: 0,
          inReviewCount: 0,
          expectedAmount: 0,
          collectedAmount: 0,
        },
      }),
    );
    expect(mail.html).toContain("0% cobrado.");
  });

  it("opens messages when receipts are clear and messages are waiting", () => {
    const mail = htmlFor(digestFixture({ pendingReceipts: 0, silentFamilies: 0, openParentMessages: 3 }));
    expect(mail.html).toContain("Responder mensajes");
    expect(mail.html).toContain(links.messages);
  });

  it("opens families when only silent families remain", () => {
    const mail = htmlFor(digestFixture({ pendingReceipts: 0, openParentMessages: 0, silentFamilies: 2 }));
    expect(mail.html).toContain("Ver familias");
    expect(mail.html).toContain(links.users);
  });

  it("uses the fallback color and skips empty classroom bars", () => {
    const charts = digestChartSvgs(
      digestFixture({
        tuition: {
          invoiceCount: 0,
          paidCount: 0,
          pendingCount: 0,
          inReviewCount: 0,
          expectedAmount: 0,
          collectedAmount: 0,
        },
        attendanceSections: 0,
        tasksDue: 0,
      }),
      { ...colors, primary: "navy" },
    );
    expect(charts.cobro).toContain('stroke="#103A5C"');
    expect(charts.cobro).toContain(">0%<");
    expect(charts.aula).not.toContain('y="14"');
    expect(charts.aula).not.toContain('y="46"');
  });
});
