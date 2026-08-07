// REGRESSION CHECK: this is the screen that answers "the teacher loaded an evaluación and I can't see
// it". The invariant on both surfaces: an exam with no published grade is still listed, and it says
// why it has no score instead of showing a blank or a zero.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, act, within } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { StudentExamResult } from "@/types/studentExams";

const mockUseAppSurface = vi.fn<() => AppSurface>();

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => mockUseAppSurface(),
}));

import { StudentExamResultsSurface } from "@/components/parent/StudentExamResultsSurface";

const copy = dictEn.dashboard.parent.exams;

const GRADED: StudentExamResult = {
  id: "asm-graded",
  name: "Unit 3 exam",
  sectionName: "B1 — Group A",
  examOn: "2026-08-05",
  maxScore: 10,
  score: 8,
  hasTeacherFeedback: true,
  state: "graded",
};

const PENDING: StudentExamResult = {
  id: "asm-pending",
  name: "Listening test",
  sectionName: "B1 — Group A",
  examOn: "2026-08-01",
  maxScore: 10,
  score: null,
  hasTeacherFeedback: false,
  state: "pending",
};

const UPCOMING: StudentExamResult = {
  id: "asm-upcoming",
  name: "Final exam",
  sectionName: "B1 — Group A",
  examOn: "2026-09-20",
  maxScore: 10,
  score: null,
  hasTeacherFeedback: false,
  state: "upcoming",
};

async function renderSurface(exams: StudentExamResult[], surface: AppSurface = "web-desktop") {
  mockUseAppSurface.mockReturnValue(surface);
  render(<StudentExamResultsSurface locale="en" exams={exams} copy={copy} />);
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe.each<[string, AppSurface]>([
  ["desktop", "web-desktop"],
  ["installed app", "pwa-mobile"],
])("StudentExamResultsSurface on %s", (_name, surface) => {
  it("lists an exam the teacher created but has not graded", async () => {
    await renderSurface([PENDING], surface);

    const list = screen.getByRole("list", { name: copy.listAria });
    expect(within(list).getByText("Listening test")).toBeInTheDocument();
    expect(within(list).getByText(copy.statePending)).toBeInTheDocument();
    expect(within(list).getByText(copy.pendingHint)).toBeInTheDocument();
  });

  it("shows the score once the grade is published", async () => {
    await renderSurface([GRADED], surface);

    expect(screen.getByLabelText("Score 8 out of 10")).toHaveTextContent("8 / 10");
    expect(screen.getByText(copy.stateGraded)).toBeInTheDocument();
  });

  it("says an exam that has not happened yet is upcoming, without inventing a result", async () => {
    await renderSurface([UPCOMING], surface);

    expect(screen.getByText(copy.stateUpcoming)).toBeInTheDocument();
    expect(screen.getByText(copy.upcomingHint)).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("points at the feedback section when a comment came with the grade", async () => {
    await renderSurface([GRADED], surface);

    expect(screen.getByText(copy.commentHint)).toBeInTheDocument();
  });

  it("keeps quiet about comments when the teacher wrote none", async () => {
    await renderSurface([PENDING], surface);

    expect(screen.queryByText(copy.commentHint)).not.toBeInTheDocument();
  });

  it("explains itself when the class has no exams at all", async () => {
    await renderSurface([], surface);

    expect(screen.getByText(copy.empty)).toBeInTheDocument();
    expect(screen.getByText(copy.emptyHint)).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: copy.listAria })).not.toBeInTheDocument();
  });

  it("names each exam's class and date", async () => {
    await renderSurface([GRADED], surface);

    expect(screen.getByText("B1 — Group A · Aug 5, 2026")).toBeInTheDocument();
  });
});
