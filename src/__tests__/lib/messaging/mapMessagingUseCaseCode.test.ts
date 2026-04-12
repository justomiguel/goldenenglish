/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import { mapMessagingUseCaseCode } from "@/lib/messaging/mapMessagingUseCaseCode";
import {
  MESSAGING_UC_INVALID_RECIPIENT,
  MESSAGING_UC_NO_TEACHER,
  MESSAGING_UC_PERSIST_FAILED,
  MESSAGING_UC_REPLY_INVALID_SENDER,
  MESSAGING_UC_REPLY_NOT_FOUND,
} from "@/lib/messaging/messagingUseCaseCodes";
import { dictEn } from "@/test/dictEn";

describe("mapMessagingUseCaseCode", () => {
  const m = dictEn.actionErrors.messaging;

  it("maps known use-case codes to dictionary strings", () => {
    expect(mapMessagingUseCaseCode(MESSAGING_UC_NO_TEACHER, m)).toBe(m.noTeacherForStudent);
    expect(mapMessagingUseCaseCode(MESSAGING_UC_REPLY_NOT_FOUND, m)).toBe(m.replyMessageNotFound);
    expect(mapMessagingUseCaseCode(MESSAGING_UC_REPLY_INVALID_SENDER, m)).toBe(
      m.replyInvalidSender,
    );
    expect(mapMessagingUseCaseCode(MESSAGING_UC_INVALID_RECIPIENT, m)).toBe(m.invalidRecipient);
    expect(mapMessagingUseCaseCode(MESSAGING_UC_PERSIST_FAILED, m)).toBe(m.persistFailed);
  });

  it("falls back to persistFailed for unknown codes", () => {
    expect(mapMessagingUseCaseCode("unknown_code", m)).toBe(m.persistFailed);
  });
});
