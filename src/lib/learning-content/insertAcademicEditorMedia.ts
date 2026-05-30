import type { Editor } from "@tiptap/core";
import { buildBlogMediaInsertHtml, buildBlogYoutubeInsertHtml } from "@/lib/blog/buildBlogMediaInsertHtml";

export type UploadedEditorMedia = {
  url: string;
  label: string;
  contentType: string;
};

export type MediaSyncToAllLocalesPayload = {
  insertHtml: string;
  blockIndex: number;
};

/** Top-level block index for the current selection (used to mirror inserts across i18n copies). */
export function getTopLevelBlockIndex(editor: Editor): number {
  const { from } = editor.state.selection;
  const $from = editor.state.doc.resolve(from);
  if ($from.depth === 0) return 0;
  return $from.index(0);
}

export function buildUploadedMediaInsertHtml(uploaded: UploadedEditorMedia): string {
  return buildBlogMediaInsertHtml(uploaded);
}

/** Inserts uploaded media at the editor caret (single-locale editors). */
export function insertUploadedMediaInEditor(editor: Editor, uploaded: UploadedEditorMedia): string {
  const html = buildUploadedMediaInsertHtml(uploaded);
  if (uploaded.contentType.startsWith("image/")) {
    editor.chain().focus().setImage({ src: uploaded.url, alt: uploaded.label }).run();
    return html;
  }
  editor.chain().focus().insertContent(html).run();
  return html;
}

/** Inserts a YouTube embed at the caret (single-locale editors). */
export function insertYoutubeInEditor(editor: Editor, url: string): string | null {
  const html = buildBlogYoutubeInsertHtml(url);
  if (!html) return null;
  editor.commands.setYoutubeVideo({ src: url, width: 720, height: 405 });
  return html;
}
