// REGRESSION CHECK: the bridge between available sections and what the picker renders. Each option
// must carry its own icon, translated label, count phrasing and unread wording, because both the
// dropdown and the sheet render straight from this list without touching the dictionary again.

import { describe, expect, it } from "vitest";
import { buildProgressPickerOptions } from "@/components/parent/buildProgressPickerOptions";
import type { ProgressSection } from "@/lib/parent/buildProgressSections";
import { dictEn } from "@/test/dictEn";

const copy = dictEn.dashboard.parent.progressPicker;

const SECTIONS: ProgressSection[] = [
  { id: "exams", count: 3, itemKeys: ["e1", "e2", "e3"] },
  { id: "tasks", count: 2, itemKeys: ["t1", "t2"] },
  { id: "feedback", count: 1, itemKeys: ["f1"] },
];

describe("buildProgressPickerOptions", () => {
  it("keeps the sections it was given, in order, naming each from the dictionary", () => {
    const options = buildProgressPickerOptions({ sections: SECTIONS, unreadBySection: {}, copy });

    expect(options.map((option) => option.id)).toEqual(["exams", "tasks", "feedback"]);
    expect(options.map((option) => option.label)).toEqual(["Exams", "Tasks", "Feedback"]);
  });

  it("phrases the count with the noun of each section", () => {
    const options = buildProgressPickerOptions({ sections: SECTIONS, unreadBySection: {}, copy });

    expect(options[0]?.countLabel).toBe("3 exams");
    expect(options[1]?.countLabel).toBe("2 tasks");
    expect(options[2]?.countLabel).toBe("1 comment");
  });

  it("carries the unread wording and its accessible name", () => {
    const options = buildProgressPickerOptions({
      sections: SECTIONS,
      unreadBySection: { feedback: 1 },
      copy,
    });

    expect(options[2]?.unreadCount).toBe(1);
    expect(options[2]?.unreadLabel).toBe("1 unread");
    expect(options[2]?.unreadAria).toBe("1 unread in Feedback");
  });

  it("leaves no unread label for a section that is fully read", () => {
    const options = buildProgressPickerOptions({
      sections: SECTIONS,
      unreadBySection: { tasks: 0 },
      copy,
    });

    expect(options[1]?.unreadLabel).toBeNull();
  });

  it("gives every option an icon", () => {
    const options = buildProgressPickerOptions({ sections: SECTIONS, unreadBySection: {}, copy });

    expect(options.every((option) => typeof option.Icon === "function" || typeof option.Icon === "object")).toBe(
      true,
    );
  });
});
