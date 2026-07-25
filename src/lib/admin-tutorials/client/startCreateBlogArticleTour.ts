import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import {
  blogNewPath,
  ensureTourPath,
  isBlogNewPath,
} from "@/lib/admin-tutorials/client/ensureTourPath";
import {
  buildCreateBlogArticleTourSteps,
  type CreateBlogArticleTourCopy,
} from "@/lib/admin-tutorials/createBlogArticleTour";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { trackEvent } from "@/lib/analytics/trackClient";

const ENTITY = "admin_tutorial:create-blog-article";

export async function startCreateBlogArticleTour(input: {
  locale: string;
  pathname: string;
  copy: CreateBlogArticleTourCopy;
  push: (href: string) => void;
}): Promise<void> {
  trackEvent("action", ENTITY, { tutorialId: "create-blog-article", phase: "start" });

  const ready = await ensureTourPath({
    locale: input.locale,
    pathname: input.pathname,
    targetPath: blogNewPath(input.locale),
    alreadyOnPath: isBlogNewPath(input.pathname, input.locale),
    waitAnchor: ADMIN_TOUR_ANCHORS.blogEditorRoot,
    push: input.push,
    scope: "admin.tutorials.createBlogArticle",
    reason: "blog_editor_missing",
  });
  if (!ready) return;

  await runDriverTour({
    steps: filterTourStepsForDom(buildCreateBlogArticleTourSteps(input.copy)),
    copy: {
      doneBtn: input.copy.doneBtn,
      nextBtn: input.copy.nextBtn,
      prevBtn: input.copy.prevBtn,
      closeBtn: input.copy.closeBtn,
      progressText: input.copy.progressText,
    },
    onComplete: () =>
      trackEvent("action", ENTITY, { tutorialId: "create-blog-article", phase: "complete" }),
    onSkip: () =>
      trackEvent("action", ENTITY, { tutorialId: "create-blog-article", phase: "skip" }),
  });
}
