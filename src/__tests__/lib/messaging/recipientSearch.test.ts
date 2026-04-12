// REGRESSION CHECK: Changing filter/group helpers affects RecipientAutocomplete options and order.
import { describe, expect, it } from "vitest";
import {
  filterMessagingRecipientsByQuery,
  groupMessagingRecipientsForPicker,
  messagingRecipientDisplayName,
  messagingRecipientMatchesQuery,
  normalizeMessagingSearchText,
} from "@/lib/messaging/recipientSearch";
import type { MessagingRecipient } from "@/types/messaging";

const ann: MessagingRecipient = {
  id: "1",
  first_name: "Ann",
  last_name: "Zed",
  role: "student",
};
const bob: MessagingRecipient = {
  id: "2",
  first_name: "Bob",
  last_name: "Admin",
  role: "teacher",
};
const carl: MessagingRecipient = {
  id: "3",
  first_name: "José",
  last_name: "Pérez",
  role: "admin",
};

describe("recipientSearch", () => {
  it("messagingRecipientDisplayName joins first and last", () => {
    expect(messagingRecipientDisplayName(ann)).toBe("Ann Zed");
  });

  it("messagingRecipientDisplayName returns empty string when both names blank", () => {
    expect(
      messagingRecipientDisplayName({
        id: "x",
        first_name: "",
        last_name: "",
        role: "student",
      }),
    ).toBe("");
  });

  it("normalizeMessagingSearchText strips accents", () => {
    expect(normalizeMessagingSearchText("José")).toBe("jose");
  });

  it("messagingRecipientMatchesQuery returns true when query is only whitespace", () => {
    expect(messagingRecipientMatchesQuery(ann, "   ")).toBe(true);
  });

  it("messagingRecipientMatchesQuery matches partial and accent-insensitive", () => {
    expect(messagingRecipientMatchesQuery(carl, "jos")).toBe(true);
    expect(messagingRecipientMatchesQuery(carl, "perez")).toBe(true);
    expect(messagingRecipientMatchesQuery(ann, "zed")).toBe(true);
    expect(messagingRecipientMatchesQuery(ann, "zzz")).toBe(false);
  });

  it("filterMessagingRecipientsByQuery returns all when query blank", () => {
    expect(filterMessagingRecipientsByQuery([ann, bob], "   ")).toEqual([ann, bob]);
  });

  it("filterMessagingRecipientsByQuery filters", () => {
    expect(filterMessagingRecipientsByQuery([ann, bob], "bob")).toEqual([bob]);
  });

  it("groupMessagingRecipientsForPicker orders student, teacher, admin then sorts names", () => {
    const labels = { student: "S", teacher: "T", admin: "A" };
    const groups = groupMessagingRecipientsForPicker([bob, ann, carl], labels);
    expect(groups.map((g) => g.role)).toEqual(["student", "teacher", "admin"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["1"]);
    expect(groups[1].items.map((i) => i.id)).toEqual(["2"]);
    expect(groups[2].items.map((i) => i.id)).toEqual(["3"]);
  });

  it("groupMessagingRecipientsForPicker orders parent after student", () => {
    const pat: MessagingRecipient = {
      id: "p1",
      first_name: "Pat",
      last_name: "Lee",
      role: "parent",
    };
    const labels = { student: "S", parent: "P", teacher: "T", admin: "A" };
    const groups = groupMessagingRecipientsForPicker([bob, pat, ann], labels);
    expect(groups.map((g) => g.role)).toEqual(["student", "parent", "teacher"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["1"]);
    expect(groups[1].items.map((i) => i.id)).toEqual(["p1"]);
    expect(groups[2].items.map((i) => i.id)).toEqual(["2"]);
  });

  it("groupMessagingRecipientsForPicker sorts by first name when last names tie", () => {
    const labels = { student: "S" };
    const zoe: MessagingRecipient = { id: "z", first_name: "Zoe", last_name: "Same", role: "student" };
    const amy: MessagingRecipient = { id: "y", first_name: "Amy", last_name: "Same", role: "student" };
    const groups = groupMessagingRecipientsForPicker([zoe, amy], labels);
    expect(groups[0].items.map((i) => i.id)).toEqual(["y", "z"]);
  });

  it("groupMessagingRecipientsForPicker appends unknown roles after known priority", () => {
    const labels = { student: "S", guardian: "Guardians" };
    const guardian: MessagingRecipient = {
      id: "g1",
      first_name: "G",
      last_name: "One",
      role: "guardian",
    };
    const groups = groupMessagingRecipientsForPicker([ann, guardian], labels);
    expect(groups.map((g) => g.role)).toEqual(["student", "guardian"]);
    expect(groups[1].label).toBe("Guardians");
  });

  it("groupMessagingRecipientsForPicker falls back to role key when label missing", () => {
    const groups = groupMessagingRecipientsForPicker([ann], {});
    expect(groups[0].label).toBe("student");
  });

  it("groupMessagingRecipientsForPicker falls back for unknown-only roles", () => {
    const coach: MessagingRecipient = {
      id: "c1",
      first_name: "Coach",
      last_name: "A",
      role: "coach",
    };
    const groups = groupMessagingRecipientsForPicker([coach], {});
    expect(groups[0].role).toBe("coach");
    expect(groups[0].label).toBe("coach");
  });

  it("groupMessagingRecipientsForPicker returns empty for empty input", () => {
    expect(groupMessagingRecipientsForPicker([], { student: "S" })).toEqual([]);
  });
});
