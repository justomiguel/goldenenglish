import type { EmailProvider } from "@/lib/email/emailProvider";
import { ResendEmailProvider } from "@/lib/email/resendEmailProvider";

export function getEmailProvider(): EmailProvider {
  return new ResendEmailProvider();
}
