export type SendEmailAttachment = {
  filename: string;
  contentBase64: string;
  contentType: string;
  contentId: string;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  cc?: string[];
  bcc?: string[];
  attachments?: SendEmailAttachment[];
};

export type SendEmailResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Port: domain and use cases depend on this abstraction, not on Resend directly (DDD).
 */
export interface EmailProvider {
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
}
