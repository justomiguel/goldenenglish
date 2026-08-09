import { describe, expect, it } from "vitest";
import { buildStudentShellConfig } from "@/lib/portal/buildStudentShellConfig";
import { dictEn } from "@/test/dictEn";

const BASE = "/en/dashboard/student";

function build(includePayments = true) {
  return buildStudentShellConfig({
    locale: "en",
    baseHref: BASE,
    dict: dictEn,
    includePayments,
  });
}

describe("buildStudentShellConfig", () => {
  it("mirrors the parent portal's four destinations in the student's own words", () => {
    const config = build();
    expect(config.destinations.map((d) => [d.id, d.href, d.label])).toEqual([
      ["home", BASE, dictEn.dashboard.studentNav.home],
      ["course", `${BASE}/progress`, dictEn.dashboard.studentNav.course],
      ["payments", `${BASE}/payments`, dictEn.dashboard.studentNav.payments],
      ["messages", `${BASE}/messages`, dictEn.dashboard.studentNav.messages],
    ]);
  });

  it("drops payments when the student cannot see them", () => {
    expect(build(false).destinations.map((d) => d.id)).toEqual([
      "home",
      "course",
      "messages",
    ]);
  });

  it("folds attendance, tasks, mini-tests and badges into the course tab", () => {
    const course = build().destinations.find((d) => d.id === "course");
    expect(course?.matchPrefixes).toEqual([
      `${BASE}/calendar`,
      `${BASE}/tasks`,
      `${BASE}/assessments`,
      `${BASE}/badges`,
    ]);
  });

  it("offers profile, settings, language, install and sign out", () => {
    expect(build().accountItems.map((item) => item.id)).toEqual([
      "profile",
      "settings",
      "language",
      "installApp",
      "signOut",
    ]);
  });

  it("has no subject chips and no tour anchors", () => {
    const config = build();
    expect(config.subjectGroups).toEqual([]);
    expect(config.tourAnchors).toEqual({});
  });
});
