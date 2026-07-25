import { startAdminTutorialCore } from "@/lib/admin-tutorials/client/startAdminTutorialCore";
import { startAdminTutorialOperational } from "@/lib/admin-tutorials/client/startAdminTutorialOperational";
import type { StartAdminTutorialInput } from "@/lib/admin-tutorials/client/startAdminTutorialTypes";
import { logClientWarn } from "@/lib/logging/clientLog";

export type { StartAdminTutorialInput } from "@/lib/admin-tutorials/client/startAdminTutorialTypes";

/** Dispatches a catalog tutorial id to its Driver.js runner. */
export async function startAdminTutorial(input: StartAdminTutorialInput): Promise<void> {
  if (await startAdminTutorialCore(input)) return;
  if (await startAdminTutorialOperational(input)) return;
  logClientWarn("admin.tutorials.start", {
    reason: "unknown_tutorial_id",
    id: String(input.id),
  });
}
