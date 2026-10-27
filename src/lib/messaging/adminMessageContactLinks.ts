export type AdminMessageContactHrefs = {
  mailto: string | null;
  gmail: string | null;
  outlook: string | null;
  whatsapp: string | null;
};

function query(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

export function buildAdminMessageContactHrefs(input: {
  email: string | null;
  whatsAppDigits: string | null;
  subject: string;
  body: string;
}): AdminMessageContactHrefs {
  const email = input.email?.trim() ?? "";
  const digits = input.whatsAppDigits?.trim() ?? "";
  const mail = email
    ? {
        mailto: `mailto:${email}?${query({ subject: input.subject, body: input.body })}`,
        gmail: `https://mail.google.com/mail/?${query({
          view: "cm",
          fs: "1",
          to: email,
          su: input.subject,
          body: input.body,
        })}`,
        outlook: `https://outlook.office.com/mail/deeplink/compose?${query({
          to: email,
          subject: input.subject,
          body: input.body,
        })}`,
      }
    : { mailto: null, gmail: null, outlook: null };

  return {
    ...mail,
    whatsapp: digits ? `https://wa.me/${digits}?${query({ text: input.body })}` : null,
  };
}
