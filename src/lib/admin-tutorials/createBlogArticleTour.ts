import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type CreateBlogArticleStepCopy = { title: string; description: string };

export type CreateBlogArticleTourCopy = {
  intro: CreateBlogArticleStepCopy;
  editor: CreateBlogArticleStepCopy;
  titleField: CreateBlogArticleStepCopy;
  body: CreateBlogArticleStepCopy;
  meta: CreateBlogArticleStepCopy;
  saveGuide: CreateBlogArticleStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export function buildCreateBlogArticleTourSteps(
  copy: CreateBlogArticleTourCopy,
): AdminTourStepDef[] {
  return [
    { anchor: null, title: copy.intro.title, description: copy.intro.description },
    {
      anchor: ADMIN_TOUR_ANCHORS.blogEditorRoot,
      title: copy.editor.title,
      description: copy.editor.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.blogEditorTitle,
      title: copy.titleField.title,
      description: copy.titleField.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.blogEditorBody,
      title: copy.body.title,
      description: copy.body.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.blogEditorMeta,
      title: copy.meta.title,
      description: copy.meta.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.blogEditorSave,
      title: copy.saveGuide.title,
      description: copy.saveGuide.description,
    },
  ];
}
