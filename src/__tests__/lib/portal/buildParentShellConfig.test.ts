import { describe, it, expect } from "vitest";
import { buildParentShellConfig } from "@/lib/portal/buildParentShellConfig";
import type { ParentFocusCatalog } from "@/lib/parent/parentFocusTypes";
import { dictEn } from "@/test/dictEn";

const BASE = "/en/dashboard/parent";

// ParentFocusCatalog keeps sections in a separate map, not nested under each
// student, and the section display field is `classLabel`.
function catalog(
  students: { id: string; label: string; sections: { id: string; label: string }[] }[],
): ParentFocusCatalog {
  return {
    students: students.map((student) => ({
      studentId: student.id,
      displayName: student.label,
    })),
    sectionsByStudentId: Object.fromEntries(
      students.map((student) => [
        student.id,
        student.sections.map((section) => ({
          sectionId: section.id,
          classLabel: section.label,
        })),
      ]),
    ),
  };
}

function build(overrides?: Partial<Parameters<typeof buildParentShellConfig>[0]>) {
  return buildParentShellConfig({
    locale: "en",
    baseHref: BASE,
    dict: dictEn,
    includePayments: true,
    focusCatalog: catalog([{ id: "s1", label: "Mateo", sections: [{ id: "sec1", label: "B1" }] }]),
    activeStudentId: "s1",
    activeSectionId: "sec1",
    ...overrides,
  });
}

describe("buildParentShellConfig", () => {
  it("produces four destinations in reading order when payments are enabled", () => {
    const config = build();
    expect(config.destinations.map((d) => d.id)).toEqual([
      "home",
      "child",
      "payments",
      "messages",
    ]);
  });

  it("omits payments when the viewer has no financial access", () => {
    const config = build({ includePayments: false });
    expect(config.destinations.map((d) => d.id)).toEqual(["home", "child", "messages"]);
  });

  it("points destinations at today's routes under the given base", () => {
    const hrefs = Object.fromEntries(build().destinations.map((d) => [d.id, d.href]));
    expect(hrefs).toEqual({
      home: BASE,
      child: `${BASE}/child`,
      payments: `${BASE}/payments`,
      messages: `${BASE}/messages`,
    });
  });

  it("lights up the child tab from the agenda and from every legacy address", () => {
    const child = build().destinations.find((d) => d.id === "child");
    expect(child?.matchPrefixes).toEqual([
      `${BASE}/calendar`,
      `${BASE}/progress`,
      `${BASE}/tasks`,
      `${BASE}/assessments`,
      `${BASE}/feedback`,
      `${BASE}/badges`,
      `${BASE}/children`,
    ]);
    const payments = build().destinations.find((d) => d.id === "payments");
    expect(payments?.matchPrefixes).toEqual([`${BASE}/billing`]);
  });

  it("sends child details to the edit route with the child in the query", () => {
    const item = build().accountItems.find((entry) => entry.id === "childDetails");
    expect(item?.href).toBe(`${BASE}/child/edit?studentId=s1`);
  });

  it("offers profile, child details, language, install and sign out in the account menu", () => {
    expect(build().accountItems.map((item) => item.id)).toEqual([
      "profile",
      "childDetails",
      "language",
      "installApp",
      "signOut",
    ]);
  });

  it("drops child details when no student is linked", () => {
    const config = build({ focusCatalog: catalog([]), activeStudentId: null });
    expect(config.accountItems.map((item) => item.id)).toEqual([
      "profile",
      "language",
      "installApp",
      "signOut",
    ]);
  });

  it("emits no subject groups for one child in one section", () => {
    expect(build().subjectGroups).toEqual([]);
  });

  it("emits a child group only when the tutor has more than one ward", () => {
    const config = build({
      focusCatalog: catalog([
        { id: "s1", label: "Mateo", sections: [{ id: "sec1", label: "B1" }] },
        { id: "s2", label: "Ana", sections: [{ id: "sec9", label: "A2" }] },
      ]),
    });
    expect(config.subjectGroups).toHaveLength(1);
    expect(config.subjectGroups[0].param).toBe("studentId");
    expect(config.subjectGroups[0].options.map((o) => o.id)).toEqual(["s1", "s2"]);
    expect(config.subjectGroups[0].activeId).toBe("s1");
  });

  it("emits a section group only when the active child has more than one section", () => {
    const config = build({
      focusCatalog: catalog([
        {
          id: "s1",
          label: "Mateo",
          sections: [
            { id: "sec1", label: "B1" },
            { id: "sec2", label: "Conversation" },
          ],
        },
      ]),
    });
    expect(config.subjectGroups.map((g) => g.param)).toEqual(["sectionId"]);
    expect(config.subjectGroups[0].options.map((o) => o.label)).toEqual(["B1", "Conversation"]);
  });
});
