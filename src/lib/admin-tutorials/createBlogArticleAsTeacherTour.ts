import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type CreateBlogArticleAsTeacherStepCopy = { title: string; description: string };

export type CreateBlogArticleAsTeacherTourCopy = {
  intro: CreateBlogArticleAsTeacherStepCopy;
  editor: CreateBlogArticleAsTeacherStepCopy;
  titleField: CreateBlogArticleAsTeacherStepCopy;
  body: CreateBlogArticleAsTeacherStepCopy;
  meta: CreateBlogArticleAsTeacherStepCopy;
  reviewStatus: CreateBlogArticleAsTeacherStepCopy;
  saveGuide: CreateBlogArticleAsTeacherStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export function buildCreateBlogArticleAsTeacherTourSteps(
  copy: CreateBlogArticleAsTeacherTourCopy,
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
      anchor: ADMIN_TOUR_ANCHORS.blogEditorStatus,
      title: copy.reviewStatus.title,
      description: copy.reviewStatus.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.blogEditorSave,
      title: copy.saveGuide.title,
      description: copy.saveGuide.description,
    },
  ];
}
