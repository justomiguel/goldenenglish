import type { EmailProvider } from "@/lib/email/emailProvider";
import { ResendEmailProvider } from "@/lib/email/resendEmailProvider";
import { RecordingEmailProvider } from "@/lib/email/recordingEmailProvider";
import { shouldUseRecordingEmailProvider } from "@/lib/email/shouldUseRecordingEmailProvider";

export function getEmailProvider(): EmailProvider {
  if (shouldUseRecordingEmailProvider()) {
    return new RecordingEmailProvider();
  }
  return new ResendEmailProvider();
}
