/** Re-exports only — server directive lives in `assignmentActions` / `templateActions`. */

export type { LearningTaskActionResult } from "./actionShared";
export { assignTemplateToSectionAction } from "./assignmentActions";
export {
  addTemplateEmbedAction,
  saveContentTemplateAction,
  uploadTemplateFileAction,
} from "./templateActions";
