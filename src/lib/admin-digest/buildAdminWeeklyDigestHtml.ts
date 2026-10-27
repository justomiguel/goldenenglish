import { adminWeeklyDigestSubject } from "@/lib/admin-digest/adminWeeklyDigestSubject";
import type { AdminWeeklyDigest, DigestColors } from "@/lib/admin-digest/adminWeeklyDigestTypes";
import { safeDigestColors } from "@/lib/admin-digest/adminWeeklyDigestCharts";
import type { DigestLabels } from "@/lib/admin-digest/adminWeeklyDigestCopy";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export type DigestLinks = {
  finance: string;
  messages: string;
  users: string;
  home: string;
};

export type DigestHtmlInput = {
  digest: AdminWeeklyDigest;
  prior: AdminWeeklyDigest | null;
  labels: DigestLabels;
  colors: DigestColors;
  links: DigestLinks;
  instituteName: string;
  weekLabel: string;
  logoUrl: string | null;
  legalLine: string;
  images: { cobro: string | null; parents: string | null; weekday: string | null; aula: string | null };
  money: (amount: number) => string;
};

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function ratio(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function delta(current: number, previous: number | undefined, labels: DigestLabels): string {
  if (previous == null) return "";
  const diff = current - previous;
  if (diff === 0) return "";
  const text = diff > 0 ? labels.up(diff) : labels.down(Math.abs(diff));
  return ` ${esc(text)}`;
}

function image(src: string | null, alt: string): string {
  if (!src) return "";
  return `<img src="${esc(src)}" alt="${esc(alt)}" width="480" style="max-width:100%;height:auto;border:0;"/>`;
}

function action(digest: AdminWeeklyDigest, labels: DigestLabels, links: DigestLinks): { href: string; label: string } {
  if (digest.pendingReceipts > 0) return { href: links.finance, label: labels.openReceipts };
  if (digest.openParentMessages > 0) return { href: links.messages, label: labels.openMessages };
  if (digest.silentFamilies > 0) return { href: links.users, label: labels.openFamilies };
  return { href: links.home, label: labels.openHome };
}

export function buildAdminWeeklyDigestHtml(input: DigestHtmlInput): { subject: string; html: string } {
  const colors = safeDigestColors(input.colors);
  const digest = input.digest;
  const labels = input.labels;
  const paidPercent = ratio(digest.tuition.paidCount, digest.tuition.invoiceCount);
  const priorPaid = input.prior
    ? ratio(input.prior.tuition.paidCount, input.prior.tuition.invoiceCount)
    : undefined;
  const button = action(digest, labels, input.links);
  const subject = adminWeeklyDigestSubject(digest, {
    receipts: labels.receipts,
    messages: labels.messages,
    silent: labels.silent,
    parents: labels.parentsSubject,
  });
  const parents = digest.topParents
    .map((parent) => {
      const name = formatProfileNameSurnameFirst(parent.firstName, parent.lastName);
      return `<li>${esc(name)} · ${esc(labels.sessionsWord(parent.sessions))}</li>`;
    })
    .join("");
  const attendance =
    digest.attendanceSections > 0
      ? esc(labels.attendanceLine(ratio(digest.attendanceMarkedSections, digest.attendanceSections)))
      : esc(labels.noClasses);
  const tasks =
    digest.tasksDue > 0
      ? esc(labels.tasksLine(ratio(digest.tasksIncomplete, digest.tasksDue)))
      : esc(labels.nothingDue);
  const quiet = digest.pendingReceipts + digest.openParentMessages + digest.silentFamilies === 0
    ? `<p>${esc(labels.quiet)}</p>`
    : "";
  const logo = input.logoUrl
    ? `<img src="${esc(input.logoUrl)}" alt="" width="40" height="40" style="border:0;vertical-align:middle;"/> `
    : "";
  const html = `<!DOCTYPE html><html lang="es"><body style="margin:0;background:${colors.background};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">
<tr><td style="background:${colors.primary};color:${colors.foreground};padding:24px;font-family:Arial,sans-serif;">
${logo}<strong>${esc(input.instituteName)}</strong><br/>${esc(input.weekLabel)}
</td></tr>
<tr><td style="padding:24px;font-family:Arial,sans-serif;color:${colors.primaryDark};">
<h1 style="font-size:20px;margin:0 0 8px;">${esc(labels.hoy)}</h1>
${quiet}
<p><a href="${esc(input.links.finance)}">${esc(labels.receipts(digest.pendingReceipts))}</a></p>
<p><a href="${esc(input.links.messages)}">${esc(labels.messages(digest.openParentMessages))}</a></p>
<p><a href="${esc(input.links.users)}">${esc(labels.silent(digest.silentFamilies))}</a></p>
<h2 style="font-size:18px;">${esc(labels.cobro)}</h2>
${image(input.images.cobro, labels.cobro)}
<p>${esc(labels.paidLine(paidPercent, input.money(digest.tuition.collectedAmount), input.money(digest.tuition.expectedAmount)))}${delta(paidPercent, priorPaid, labels)}</p>
<p>${esc(labels.funnel(digest.funnel.invoices, digest.funnel.openedPayments, digest.funnel.checkoutsStarted, digest.funnel.paidInvoices))}</p>
<h2 style="font-size:18px;">${esc(labels.padres)}</h2>
${image(input.images.parents, labels.padres)}
<p>${esc(labels.parentLine(digest.parentPercent))}${delta(digest.parentPercent, input.prior?.parentPercent, labels)}</p>
<ul>${parents}</ul>
<h2 style="font-size:18px;">${esc(labels.weekday)}</h2>
${image(input.images.weekday, labels.weekday)}
<p>${digest.weekdaySessions.map((count, index) => `${esc(labels.weekdays[index])} ${count}`).join(" · ")}</p>
<h2 style="font-size:18px;">${esc(labels.aula)}</h2>
${image(input.images.aula, labels.aula)}
<p>${attendance}</p><p>${tasks}</p>
<h2 style="font-size:18px;">${esc(labels.entrada)}</h2>
<p>${esc(labels.intake(digest.registrations, digest.eventEnrollments, digest.signedInSessions, digest.publicPageViews))}</p>
<p><a href="${esc(button.href)}" style="display:inline-block;background:${colors.primary};color:${colors.foreground};padding:12px 18px;text-decoration:none;">${esc(button.label)}</a></p>
<p style="font-size:12px;">${esc(input.legalLine)}</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, html };
}
