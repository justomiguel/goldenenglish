import { describe, expect, it } from "vitest";
import { eventShareFailureMessage } from "@/lib/events/eventShareFailureMessage";

const sentences = {
  slug_taken: "That site already has this link. Code: slug_taken",
};

describe("eventShareFailureMessage", () => {
  it("returns the sentence for a known code", () => {
    expect(eventShareFailureMessage("slug_taken", sentences)).toBe(sentences.slug_taken);
  });

  it("returns the raw code when no sentence exists", () => {
    expect(eventShareFailureMessage("share_mystery", sentences)).toBe("share_mystery");
  });
});
