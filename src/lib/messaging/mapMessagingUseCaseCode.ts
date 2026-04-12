import type { Dictionary } from "@/types/i18n";
import {
  MESSAGING_UC_INVALID_RECIPIENT,
  MESSAGING_UC_NO_TEACHER,
  MESSAGING_UC_PERSIST_FAILED,
  MESSAGING_UC_REPLY_INVALID_SENDER,
  MESSAGING_UC_REPLY_NOT_FOUND,
} from "@/lib/messaging/messagingUseCaseCodes";

export function mapMessagingUseCaseCode(
  code: string,
  messaging: Dictionary["actionErrors"]["messaging"],
): string {
  switch (code) {
    case MESSAGING_UC_NO_TEACHER:
      return messaging.noTeacherForStudent;
    case MESSAGING_UC_REPLY_NOT_FOUND:
      return messaging.replyMessageNotFound;
    case MESSAGING_UC_REPLY_INVALID_SENDER:
      return messaging.replyInvalidSender;
    case MESSAGING_UC_INVALID_RECIPIENT:
      return messaging.invalidRecipient;
    case MESSAGING_UC_PERSIST_FAILED:
      return messaging.persistFailed;
    default:
      return messaging.persistFailed;
  }
}
