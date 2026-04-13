"use client";

import { useCallback, useState } from "react";

interface UseImportJobCancelArgs {
  genericError: string;
  cancelError: string;
  setSummary: (value: string) => void;
  setDetail: (value: string) => void;
}

export function useImportJobCancel({
  genericError,
  cancelError,
  setSummary,
  setDetail,
}: UseImportJobCancelArgs) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);

  const resetCancelState = useCallback(() => {
    setJobId(null);
    setCancelBusy(false);
  }, []);

  const cancelImport = useCallback(async () => {
    if (!jobId || cancelBusy) return;
    setCancelBusy(true);
    try {
      const response = await fetch(`/api/admin/import/jobs/${jobId}`, { method: "DELETE" });
      if (!response.ok) {
        setSummary(genericError);
        setDetail(cancelError);
      }
    } catch {
      setSummary(genericError);
      setDetail(cancelError);
    } finally {
      setCancelBusy(false);
    }
  }, [cancelBusy, cancelError, genericError, jobId, setDetail, setSummary]);

  return { jobId, setJobId, cancelBusy, cancelImport, resetCancelState };
}
