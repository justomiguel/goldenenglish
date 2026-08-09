// REGRESSION CHECK: a tutor whose RLS reads timed out saw a Progress screen offering only Badges,
// which reads as "your child has nothing loaded". A failed read must stay on screen, say it failed,
// and offer a retry — never disappear into the same emptiness as a ward with no content.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockSearchParams } from "@/test/navigationMock";
import { installMemoryLocalStorage } from "@/__tests__/helpers/installMemoryLocalStorage";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { ParentFeedbackTimeline } from "@/types/parentFeedback";
import type { StudentBadgeRowModel } from "@/types/studentBadges";

const mockUseAppSurface = vi.fn<() => AppSurface>();

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => mockUseAppSurface(),
}));

import { ParentProgressEntry } from "@/components/parent/ParentProgressEntry";

const EMPTY_TIMELINE: ParentFeedbackTimeline = { items: [], newCount: 0 };

const EARNED_BADGE: StudentBadgeRowModel = {
  id: "badge-1",
  badgeCode: "first_task",
  earnedAt: "2026-07-30",
  shareUrl: "https://example.test/b/x",
  locked: false,
  progress: null,
};

const WARDS = [{ studentId: "stu-1", displayName: "Vera Luna" }];
const picker = dictEn.dashboard.parent.progressPicker;

function renderEntry(failedSections: string[], surface: AppSurface = "web-desktop") {
  mockUseAppSurface.mockReturnValue(surface);
  render(
    <ParentProgressEntry
      locale="en"
      wardOptions={WARDS}
      selectedStudentId="stu-1"
      exams={[]}
      tasks={[]}
      assessments={[]}
      feedback={EMPTY_TIMELINE}
      badgeRows={[EARNED_BADGE]}
      failedSections={failedSections as never}
      parentLabels={dictEn.dashboard.parent}
      studentLabels={dictEn.dashboard.student}
      badgesDict={dictEn.dashboard.student.badges}
      shellOwnsFocus
    />,
  );
}

beforeEach(() => {
  installMemoryLocalStorage();
  mockSearchParams(new URLSearchParams());
});

describe("Progress tells the family when a read failed", () => {
  it("still offers a section whose read failed, even with nothing in it", () => {
    renderEntry(["exams"]);

    expect(screen.getByText(picker.sectionExams)).toBeInTheDocument();
  });

  it("opens that section and explains it could not be loaded", () => {
    renderEntry(["exams"]);

    expect(screen.getByText(picker.loadFailedTitle)).toBeInTheDocument();
    expect(screen.getByText(picker.loadFailedBody)).toBeInTheDocument();
  });

  it("offers a way to try again", () => {
    renderEntry(["exams"]);

    expect(screen.getByRole("button", { name: picker.loadFailedRetry })).toBeInTheDocument();
  });

  it("warns above the picker that the screen is incomplete", () => {
    renderEntry(["exams", "feedback"]);

    expect(screen.getByText(picker.loadFailedBanner)).toBeInTheDocument();
  });

  it("says nothing about failures when every read succeeded", () => {
    renderEntry([]);

    expect(screen.queryByText(picker.loadFailedBanner)).not.toBeInTheDocument();
    expect(screen.queryByText(picker.loadFailedTitle)).not.toBeInTheDocument();
  });

  it("does not claim a healthy section failed", () => {
    renderEntry(["exams"]);

    // Badges has real content and loaded fine, so it must render its own screen, not the retry state.
    expect(screen.getAllByText(picker.loadFailedTitle)).toHaveLength(1);
  });

  it("works the same on the PWA surface", () => {
    renderEntry(["feedback"], "pwa-mobile");

    expect(screen.getByText(picker.loadFailedTitle)).toBeInTheDocument();
  });
});
