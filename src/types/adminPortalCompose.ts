/** Server-computed compose mode when opening admin messages compose with `?replyTo=`. */
export type AdminPortalReplyBootstrap =
  | { kind: "none" }
  | { kind: "portal"; recipientProfileId: string }
  | { kind: "external_email"; sourceMessageId: string; visitorEmail: string }
  | { kind: "error"; code: "invalid_or_forbidden" | "missing_visitor_email" };
