import { describe, it, expect } from "vitest";
import { countFamilyInboundThreadsAwaitingReply } from "@/lib/teacher/countFamilyInboundThreadsAwaitingReply";

describe("countFamilyInboundThreadsAwaitingReply", () => {
  it("counts peers whose latest message is inbound from student or parent", () => {
    const teacher = "t1";
    const roles = new Map<string, string>([
      ["s1", "student"],
      ["p1", "parent"],
      ["a1", "admin"],
    ]);
    const msgs = [
      { sender_id: "s1", recipient_id: teacher },
      { sender_id: teacher, recipient_id: "s1" },
      { sender_id: "p1", recipient_id: teacher },
      { sender_id: teacher, recipient_id: "a1" },
      { sender_id: "a1", recipient_id: teacher },
    ];
    expect(countFamilyInboundThreadsAwaitingReply(msgs, teacher, roles)).toBe(2);
  });

  it("returns zero when teacher sent last in all threads", () => {
    const teacher = "t1";
    const roles = new Map<string, string>([["s1", "student"]]);
    const msgs = [
      { sender_id: teacher, recipient_id: "s1" },
      { sender_id: "s1", recipient_id: teacher },
    ];
    expect(countFamilyInboundThreadsAwaitingReply(msgs, teacher, roles)).toBe(0);
  });
});
