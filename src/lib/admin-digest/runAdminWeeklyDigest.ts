import { buildAdminWeeklyDigestHtml } from "@/lib/admin-digest/buildAdminWeeklyDigestHtml";
import { digestChartSvgs } from "@/lib/admin-digest/adminWeeklyDigestCharts";
import { DIGEST_LABELS } from "@/lib/admin-digest/adminWeeklyDigestCopy";
import { closedWeekBounds } from "@/lib/admin-digest/closedWeekBounds";
import { parseAdminWeeklyDigest } from "@/lib/admin-digest/parseAdminWeeklyDigest";
import type { AdminWeeklyDigest, DigestColors } from "@/lib/admin-digest/adminWeeklyDigestTypes";
import { logServerError, logServerInfo, logServerWarn } from "@/lib/logging/serverActionLog";

const SCOPE = "admin.weekly_digest";

export type DigestMailAttachment = {
  filename: string;
  contentBase64: string;
  contentType: string;
  contentId: string;
};

export type RunAdminWeeklyDigestDeps = {
  enabled: boolean;
  now: Date;
  timeZone: string;
  origin: string;
  instituteName: string;
  logoUrl: string | null;
  legalLine: string;
  colors: DigestColors;
  loadDigest: (args: {
    weekStart: string;
    weekEnd: string;
    monthStart: string;
    monthEnd: string;
    silentSince: string;
    timeZone: string;
  }) => Promise<{ data: unknown; error: string | null }>;
  loadPriorPayload: (weekStartDate: string) => Promise<unknown>;
  claimWeek: (weekStartDate: string, payload: AdminWeeklyDigest) => Promise<string[] | null>;
  listAdmins: () => Promise<{ id: string; email: string }[]>;
  sendMail: (input: {
    to: string;
    subject: string;
    html: string;
    attachments: DigestMailAttachment[];
  }) => Promise<boolean>;
  markSent: (weekStartDate: string, recipientIds: string[]) => Promise<void>;
  rasterize: (svg: string) => Promise<string | null>;
};

export type RunAdminWeeklyDigestResult =
  | { ok: true; sent: number }
  | { ok: false; code: "aggregate" | "invalid" | "claim" | "send"; sent: number };

export async function runAdminWeeklyDigest(
  deps: RunAdminWeeklyDigestDeps,
): Promise<RunAdminWeeklyDigestResult> {
  if (!deps.enabled) return { ok: true, sent: 0 };
  const bounds = closedWeekBounds(deps.now, deps.timeZone);
  const silentSince = new Date(deps.now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const loaded = await deps.loadDigest({
    weekStart: bounds.weekStart.toISOString(),
    weekEnd: bounds.weekEnd.toISOString(),
    monthStart: bounds.monthStart,
    monthEnd: bounds.monthEnd,
    silentSince: silentSince.toISOString(),
    timeZone: deps.timeZone,
  });
  if (loaded.error) {
    logServerError(SCOPE, { code: "aggregate", weekStart: bounds.weekStartDate });
    return { ok: false, code: "aggregate", sent: 0 };
  }
  const digest = parseAdminWeeklyDigest(loaded.data);
  if (!digest) {
    logServerError(SCOPE, { code: "invalid", weekStart: bounds.weekStartDate });
    return { ok: false, code: "invalid", sent: 0 };
  }
  const prior = parseAdminWeeklyDigest(await deps.loadPriorPayload(bounds.priorWeekStartDate));
  const charts = digestChartSvgs(digest, deps.colors);
  const cobro = await rasterOrNull(deps, charts.cobro);
  const parents = await rasterOrNull(deps, charts.parents);
  const weekday = await rasterOrNull(deps, charts.weekday);
  const aula = await rasterOrNull(deps, charts.aula);
  const mail = buildAdminWeeklyDigestHtml({
    digest,
    prior,
    labels: DIGEST_LABELS.es,
    colors: deps.colors,
    links: digestLinks(deps.origin),
    instituteName: deps.instituteName,
    weekLabel: weekLabel(bounds.weekStart, bounds.weekEnd, deps.timeZone),
    logoUrl: deps.logoUrl,
    legalLine: deps.legalLine,
    images: {
      cobro: cobro ? "cid:cobro" : null,
      parents: parents ? "cid:parents" : null,
      weekday: weekday ? "cid:weekday" : null,
      aula: aula ? "cid:aula" : null,
    },
    money: (amount) => new Intl.NumberFormat("es", { maximumFractionDigits: 0 }).format(amount),
  });
  const already = await deps.claimWeek(bounds.weekStartDate, digest);
  if (!already) return { ok: false, code: "claim", sent: 0 };
  const sentIds = new Set(already);
  const admins = (await deps.listAdmins()).filter((admin) => !sentIds.has(admin.id));
  const attachments = chartAttachments({ cobro, parents, weekday, aula });
  let sent = 0;
  let failed = 0;
  for (const admin of admins) {
    const ok = await deps.sendMail({ to: admin.email, subject: mail.subject, html: mail.html, attachments });
    if (!ok) {
      failed += 1;
      logServerWarn(SCOPE, { code: "send_failed", weekStart: bounds.weekStartDate });
      continue;
    }
    sentIds.add(admin.id);
    sent += 1;
  }
  if (sent > 0) await deps.markSent(bounds.weekStartDate, [...sentIds]);
  logServerInfo(SCOPE, { weekStart: bounds.weekStartDate, recipientCount: sentIds.size });
  if (failed > 0) return { ok: false, code: "send", sent };
  return { ok: true, sent };
}

async function rasterOrNull(deps: RunAdminWeeklyDigestDeps, svg: string): Promise<string | null> {
  const png = await deps.rasterize(svg);
  if (!png) logServerWarn(SCOPE, { code: "chart_raster_failed" });
  return png;
}

function chartAttachments(images: {
  cobro: string | null;
  parents: string | null;
  weekday: string | null;
  aula: string | null;
}): DigestMailAttachment[] {
  return (["cobro", "parents", "weekday", "aula"] as const).flatMap((id) => {
    const contentBase64 = images[id];
    if (!contentBase64) return [];
    return [{ filename: `${id}.png`, contentBase64, contentType: "image/png", contentId: id }];
  });
}

function digestLinks(origin: string) {
  const base = origin.replace(/\/$/, "");
  return {
    finance: `${base}/es/dashboard/admin/finance`,
    messages: `${base}/es/dashboard/admin/messages`,
    users: `${base}/es/dashboard/admin/users`,
    home: `${base}/es/dashboard/admin`,
  };
}

function weekLabel(start: Date, end: Date, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}
