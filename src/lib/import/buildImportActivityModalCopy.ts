import type { Dictionary } from "@/types/i18n";
import type { LongJobSnapshot } from "@/types/longJob";

type ImportModalLabels = Pick<
  Dictionary["admin"]["import"],
  | "importModalIntro"
  | "importModalWaiting"
  | "importModalActiveRow"
  | "importModalSecondary"
  | "importModalAllRowsDone"
  | "importModalExplainBody"
  | "importModalLogTitle"
  | "progressQueued"
  | "jobLogFinalize"
>;

export function buildImportActivityModalCopy(args: {
  labels: ImportModalLabels;
  jobSnapshot: LongJobSnapshot | null;
  importTotalRows: number | null;
  logModalLive: boolean;
}): {
  introLine: string;
  primaryLine: string;
  secondaryLine: string | null;
  explainBody: string;
  logTitle: string;
} {
  const { labels, jobSnapshot, importTotalRows, logModalLive } = args;
  const totalFromSnap =
    typeof jobSnapshot?.total === "number" && jobSnapshot.total > 0 ? jobSnapshot.total : 0;
  const displayTotal =
    typeof importTotalRows === "number" && importTotalRows > 0 ? importTotalRows : totalFromSnap;

  const activeRow =
    jobSnapshot && typeof jobSnapshot.activeRow === "number" ? jobSnapshot.activeRow : 0;
  const rowsDone =
    jobSnapshot && typeof jobSnapshot.current === "number" ? jobSnapshot.current : null;
  const status = jobSnapshot?.status;
  const phase = typeof jobSnapshot?.phase === "string" ? jobSnapshot.phase : "";

  const introLine = labels.importModalIntro.replace(
    "{{total}}",
    displayTotal > 0 ? String(displayTotal) : "—",
  );

  let primaryLine = labels.importModalWaiting;
  if (status === "queued") {
    primaryLine = labels.progressQueued;
  } else if (status === "running" && phase === "finalize") {
    primaryLine = labels.jobLogFinalize;
  } else if (status === "running" && phase === "rows") {
    if (logModalLive && activeRow > 0 && displayTotal > 0) {
      primaryLine = labels.importModalActiveRow
        .replace("{{current}}", String(activeRow))
        .replace("{{total}}", String(displayTotal));
    } else if (logModalLive) {
      primaryLine = labels.importModalWaiting;
    } else if (displayTotal > 0) {
      primaryLine = labels.importModalAllRowsDone.replace("{{total}}", String(displayTotal));
    }
  } else if (!logModalLive && displayTotal > 0) {
    primaryLine = labels.importModalAllRowsDone.replace("{{total}}", String(displayTotal));
  }

  let secondaryLine: string | null = null;
  if (
    logModalLive &&
    status === "running" &&
    phase === "rows" &&
    displayTotal > 0 &&
    rowsDone != null
  ) {
    secondaryLine = labels.importModalSecondary
      .replace("{{done}}", String(rowsDone))
      .replace("{{total}}", String(displayTotal));
  }

  return {
    introLine,
    primaryLine,
    secondaryLine,
    explainBody: labels.importModalExplainBody,
    logTitle: labels.importModalLogTitle,
  };
}
