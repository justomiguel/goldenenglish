import { portalMessageBodyPreviewPlainText } from "@/lib/messaging/portalMessageBodyPreviewPlainText";

export const ADMIN_MESSAGE_FOLLOW_UP_CHANNELS = ["whatsapp", "mailto", "gmail", "outlook"] as const;

export type AdminMessageFollowUpChannel = (typeof ADMIN_MESSAGE_FOLLOW_UP_CHANNELS)[number];

export type AdminMessageFollowUpFact = {
  channel: AdminMessageFollowUpChannel;
  actorName: string;
  at: string;
};

export type AdminMessageStatusLine = {
  kind: "unread" | "read-only" | "portal-reply" | "email-reply" | "follow-up";
  actorName?: string;
  at?: string;
  snippet?: string;
  html?: string;
  channel?: AdminMessageFollowUpChannel;
};

export type StaffAnswerCandidate = {
  id: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
  senderRole: string;
  senderName: string;
  bodyHtml: string;
  visitorEmail: string | null;
};

export type StaffAnswerMatch = {
  kind: "portal" | "email";
  actorName: string;
  at: string;
  snippet: string;
  html?: string;
};

const STAFF_ROLES = new Set(["admin", "teacher"]);
const SNIPPET_MAX = 120;

export function isAdminMessageFollowUpChannel(value: string): value is AdminMessageFollowUpChannel {
  return (ADMIN_MESSAGE_FOLLOW_UP_CHANNELS as readonly string[]).includes(value);
}

export function matchLatestStaffAnswer(input: {
  inboundId: string;
  inboundSenderId: string;
  inboundCreatedAt: string;
  source: "contact_form" | "internal";
  visitorEmail: string | null;
  candidates: StaffAnswerCandidate[];
  includeHtml?: boolean;
}): StaffAnswerMatch | null {
  const inboundMs = new Date(input.inboundCreatedAt).getTime();
  const visitor = (input.visitorEmail ?? "").trim().toLowerCase();
  let best: StaffAnswerCandidate | null = null;
  let bestMs = inboundMs;

  for (const row of input.candidates) {
    if (row.id === input.inboundId) continue;
    if (!STAFF_ROLES.has(row.senderRole)) continue;
    if (row.recipientId !== input.inboundSenderId) continue;
    const ms = new Date(row.createdAt).getTime();
    if (!(ms > bestMs)) continue;
    if (input.source === "contact_form") {
      const email = (row.visitorEmail ?? "").trim().toLowerCase();
      if (!visitor || email !== visitor) continue;
    }
    best = row;
    bestMs = ms;
  }

  if (!best) return null;
  return {
    kind: input.source === "contact_form" ? "email" : "portal",
    actorName: best.senderName,
    at: best.createdAt,
    snippet: portalMessageBodyPreviewPlainText(best.bodyHtml, SNIPPET_MAX),
    ...(input.includeHtml ? { html: best.bodyHtml } : {}),
  };
}

export function buildAdminMessageStatusStack(input: {
  readAt: string | null;
  reply: StaffAnswerMatch | null;
  followUps: AdminMessageFollowUpFact[];
}): AdminMessageStatusLine[] {
  const unread = input.readAt == null || input.readAt === "";
  const followUps = [...input.followUps].sort((a, b) => a.at.localeCompare(b.at));
  const hasReply = input.reply != null;
  const lines: AdminMessageStatusLine[] = [];

  if (unread) lines.push({ kind: "unread" });
  else if (!hasReply && followUps.length === 0) lines.push({ kind: "read-only" });

  if (input.reply) {
    lines.push({
      kind: input.reply.kind === "email" ? "email-reply" : "portal-reply",
      actorName: input.reply.actorName,
      at: input.reply.at,
      snippet: input.reply.snippet,
      ...(input.reply.html ? { html: input.reply.html } : {}),
    });
  }

  for (const row of followUps) {
    lines.push({
      kind: "follow-up",
      channel: row.channel,
      actorName: row.actorName,
      at: row.at,
    });
  }

  return lines;
}

type InboxStatusRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body_html: string;
  created_at: string;
  read_at?: string | null;
  external_contact_reply_email?: string | null;
};

export type InboxMessageStatus = {
  lines: AdminMessageStatusLine[];
  hasFollowUp: boolean;
  hasStaffAnswer: boolean;
};

export function buildInboxStatusById(
  rows: InboxStatusRow[],
  metaById: Map<string, { name: string; role: string }>,
  followUps: Map<string, AdminMessageFollowUpFact[]>,
  inboundIds: ReadonlySet<string>,
): Map<string, InboxMessageStatus> {
  const candidates: StaffAnswerCandidate[] = rows.map((row) => {
    const sender = metaById.get(row.sender_id);
    return {
      id: row.id,
      senderId: row.sender_id,
      recipientId: row.recipient_id,
      createdAt: row.created_at,
      senderRole: sender?.role ?? "",
      senderName: sender?.name ?? "",
      bodyHtml: row.body_html,
      visitorEmail: row.external_contact_reply_email ?? null,
    };
  });

  const out = new Map<string, InboxMessageStatus>();
  for (const row of rows) {
    if (!inboundIds.has(row.id)) continue;
    const sender = metaById.get(row.sender_id);
    const source = sender?.role === "site_contact" ? "contact_form" : "internal";
    const ups = followUps.get(row.id) ?? [];
    const reply = matchLatestStaffAnswer({
      inboundId: row.id,
      inboundSenderId: row.sender_id,
      inboundCreatedAt: row.created_at,
      source,
      visitorEmail: row.external_contact_reply_email ?? null,
      candidates,
    });
    out.set(row.id, {
      lines: buildAdminMessageStatusStack({
        readAt: row.read_at ?? null,
        reply,
        followUps: ups,
      }),
      hasFollowUp: ups.length > 0,
      hasStaffAnswer: reply != null,
    });
  }
  return out;
}
