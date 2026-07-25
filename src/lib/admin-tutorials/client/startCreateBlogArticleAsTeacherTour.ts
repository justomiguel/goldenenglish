import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import {
  blogNewPath,
  ensureTourPath,
  isBlogNewPath,
} from "@/lib/admin-tutorials/client/ensureTourPath";
import {
  buildCreateBlogArticleAsTeacherTourSteps,
  type CreateBlogArticleAsTeacherTourCopy,
} from "@/lib/admin-tutorials/createBlogArticleAsTeacherTour";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { trackEvent } from "@/lib/analytics/trackClient";

const TUTORIAL_ID = "create-blog-article-as-teacher" as const;
const ENTITY = `admin_tutorial:${TUTORIAL_ID}`;

export async function startCreateBlogArticleAsTeacherTour(input: {
  locale: string;
  pathname: string;
  copy: CreateBlogArticleAsTeacherTourCopy;
  push: (href: string) => void;
}): Promise<void> {
  trackEvent("action", ENTITY, { tutorialId: TUTORIAL_ID, phase: "start" });

  const ready = await ensureTourPath({
    locale: input.locale,
    pathname: input.pathname,
    targetPath: blogNewPath(input.locale),
    alreadyOnPath: isBlogNewPath(input.pathname, input.locale),
    waitAnchor: ADMIN_TOUR_ANCHORS.blogEditorRoot,
    push: input.push,
    scope: "admin.tutorials.createBlogArticleAsTeacher",
    reason: "blog_editor_missing",
  });
  if (!ready) return;

  await runDriverTour({
    steps: filterTourStepsForDom(buildCreateBlogArticleAsTeacherTourSteps(input.copy)),
    copy: {
      doneBtn: input.copy.doneBtn,
      nextBtn: input.copy.nextBtn,
      prevBtn: input.copy.prevBtn,
      closeBtn: input.copy.closeBtn,
      progressText: input.copy.progressText,
    },
    onComplete: () =>
      trackEvent("action", ENTITY, { tutorialId: TUTORIAL_ID, phase: "complete" }),
    onSkip: () =>
      trackEvent("action", ENTITY, { tutorialId: TUTORIAL_ID, phase: "skip" }),
  });
}
