import { createAdminClient } from "@/lib/supabase/admin";
import { bulkImportStudentsFromRowsAdmin } from "@/lib/import/bulkImportStudents";
import type { CsvStudentRow } from "@/lib/import/studentRowSchema";
import type { TutorDisplayDefaults } from "@/lib/register/tutorDisplayNameParts";
import { mergeImportJob, readImportJob } from "@/lib/import/importJobKv";
import { IMPORT_JOB_CANCELLED_BY_USER } from "@/lib/import/importJobErrorCodes";
import { IMPORT_ROW_UNKNOWN } from "@/lib/import/importResultMessageCodes";
import { logServerException } from "@/lib/logging/serverActionLog";

const ACTIVITY_LOG_EVERY = 15;

export async function runBulkImportJobWithKv(
  jobId: string,
  ownerId: string,
  rows: CsvStudentRow[],
  tutorDefaults: TutorDisplayDefaults,
): Promise<void> {
  const total = rows.length;
  try {
    await mergeImportJob(jobId, {
      ownerId,
      status: "running",
      phase: "rows",
      message: "",
      current: 0,
      total,
      activeRow: 0,
      activityAppend: { t: Date.now(), code: "rows_begin", meta: { total } },
    });

    const admin = createAdminClient();
    const throwIfCancelled = async () => {
      const latest = await readImportJob(jobId);
      if (latest?.phase === "cancelled" || latest?.error === IMPORT_JOB_CANCELLED_BY_USER) {
        throw new Error(IMPORT_JOB_CANCELLED_BY_USER);
      }
    };

    const onRowStart = async (rowIndex: number, tot: number) => {
      await throwIfCancelled();
      await mergeImportJob(jobId, {
        ownerId,
        status: "running",
        phase: "rows",
        message: "",
        current: rowIndex - 1,
        total: tot,
        activeRow: rowIndex,
      });
    };

    const onProgress = async (completed: number, tot: number) => {
      await throwIfCancelled();
      const shouldLog =
        completed === 0 ||
        completed === tot ||
        completed % ACTIVITY_LOG_EVERY === 0;
      await mergeImportJob(jobId, {
        ownerId,
        status: "running",
        phase: "rows",
        message: "",
        current: completed,
        total: tot,
        ...(shouldLog
          ? {
              activityAppend: {
                t: Date.now(),
                code: "row_progress",
                meta: { current: completed, total: tot },
              },
            }
          : {}),
      });
    };

    const result = await bulkImportStudentsFromRowsAdmin(admin, rows, tutorDefaults, {
      onRowStart,
      onProgress,
      progressEveryRow: true,
    });

    await throwIfCancelled();
    await mergeImportJob(jobId, {
      ownerId,
      status: "running",
      phase: "finalize",
      message: "",
      current: total,
      total,
      activeRow: total,
      activityAppend: { t: Date.now(), code: "finalize" },
    });

    await mergeImportJob(jobId, {
      ownerId,
      status: "done",
      phase: "done",
      message: "",
      current: total,
      total,
      activeRow: total,
      result,
      activityAppend: { t: Date.now(), code: "completed" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : IMPORT_ROW_UNKNOWN;
    if (msg === IMPORT_JOB_CANCELLED_BY_USER) {
      return;
    }
    logServerException("runBulkImportJobWithKv", e, { jobId, ownerId });
    await mergeImportJob(jobId, {
      ownerId,
      status: "error",
      phase: "error",
      message: msg,
      error: msg,
      current: 0,
      total,
      activityAppend: {
        t: Date.now(),
        code: "failed",
        meta: { error: msg.slice(0, 200) },
      },
    });
  }
}
