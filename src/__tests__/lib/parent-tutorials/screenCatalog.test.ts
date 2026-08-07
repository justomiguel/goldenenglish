// REGRESSION CHECK: Parent screen path matching must stay exact (no inherit to
// task detail / payment return) so Help Explain CTA and L3 matrix stay aligned.
import { describe, expect, it } from "vitest";
import {
  resolveParentScreenTour,
  parentHomePath,
} from "@/lib/parent-tutorials/screenCatalog";

describe("resolveParentScreenTour", () => {
  const locale = "es";

  it("matches parent home exactly", () => {
    expect(resolveParentScreenTour(parentHomePath(locale), locale)?.id).toBe(
      "parent-home",
    );
    expect(resolveParentScreenTour(`/${locale}/dashboard/parent/`, locale)?.scope).toBe(
      "chrome-and-content",
    );
  });

  it("matches top-level and secondary hubs as content-only", () => {
    const cases: Array<[string, string]> = [
      [`/${locale}/dashboard/parent/calendar`, "parent-calendar"],
      [`/${locale}/dashboard/parent/progress`, "parent-progress"],
      [`/${locale}/dashboard/parent/payments`, "parent-payments"],
      [`/${locale}/dashboard/parent/messages`, "parent-messages"],
      [`/${locale}/dashboard/parent/settings`, "parent-settings"],
      [`/${locale}/dashboard/parent/billing`, "parent-billing"],
      [`/${locale}/dashboard/parent/tasks`, "parent-tasks"],
      [`/${locale}/dashboard/parent/assessments`, "parent-assessments"],
      [`/${locale}/dashboard/parent/badges`, "parent-badges"],
      [
        `/${locale}/dashboard/parent/children/abc-uuid`,
        "parent-child-detail",
      ],
      [`/${locale}/dashboard/profile`, "parent-profile"],
    ];
    for (const [path, id] of cases) {
      const match = resolveParentScreenTour(path, locale);
      expect(match?.id, path).toBe(id);
      expect(match?.scope, path).toBe("content-only");
    }
  });

  it("matches billing on legacy path and payments fees tab", () => {
    expect(
      resolveParentScreenTour(`/${locale}/dashboard/parent/payments?tab=fees`, locale)?.id,
    ).toBe("parent-billing");
  });

  it("matches progress hub tabs for tasks/assessments/badges", () => {
    expect(
      resolveParentScreenTour(`/${locale}/dashboard/parent/progress?tab=tasks`, locale)?.id,
    ).toBe("parent-tasks");
    expect(
      resolveParentScreenTour(
        `/${locale}/dashboard/parent/progress?tab=assessments`,
        locale,
      )?.id,
    ).toBe("parent-assessments");
    expect(
      resolveParentScreenTour(`/${locale}/dashboard/parent/progress?tab=badges`, locale)?.id,
    ).toBe("parent-badges");
    expect(
      resolveParentScreenTour(`/${locale}/dashboard/parent/progress`, locale)?.id,
    ).toBe("parent-progress");
  });

  it("does not match nested payment returns or task detail", () => {
    expect(
      resolveParentScreenTour(
        `/${locale}/dashboard/parent/payments/mp-return`,
        locale,
      ),
    ).toBeNull();
    expect(
      resolveParentScreenTour(
        `/${locale}/dashboard/parent/tasks/task-instance-1`,
        locale,
      ),
    ).toBeNull();
  });
});
