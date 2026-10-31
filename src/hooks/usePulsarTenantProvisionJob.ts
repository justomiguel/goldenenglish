"use client";

import { useState } from "react";
import { useLongJobPoll } from "@/hooks/useLongJobPoll";
import {
  provisionActivityLines,
  provisionPrimaryLine,
  type ProvisionPhaseCopy,
} from "@/lib/pulsar/instituteSchemaProvisionProgressView";
import { postgresSchemaForInstituteSlug } from "@/lib/tenant/postgresSchemaForInstituteSlug";
import type { LongJobSnapshot } from "@/types/longJob";

const GRACE_MS = 400;

export type PulsarTenantSaveResult = { ok: true; slug: string } | { ok: false; errorCode: string };

type ProvisionCopy = ProvisionPhaseCopy & { count: string };

function countLine(snapshot: LongJobSnapshot, template: string): string | null {
  const total = typeof snapshot.total === "number" ? snapshot.total : 0;
  if (total <= 0) return null;
  const current = typeof snapshot.current === "number" ? snapshot.current : 0;
  return template.replaceAll("{current}", String(current)).replaceAll("{total}", String(total));
}

export function usePulsarTenantProvisionJob(copy: ProvisionCopy) {
  const poll = useLongJobPoll();
  const [open, setOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const track = async (
    slug: string,
    save: () => Promise<PulsarTenantSaveResult>,
  ): Promise<PulsarTenantSaveResult> => {
    let schema = "";
    try {
      schema = postgresSchemaForInstituteSlug(slug);
    } catch {
      return save();
    }

    setOpen(true);
    setIsRunning(true);
    poll.reset();
    const controller = new AbortController();
    const polling = poll.pollUntilDone({
      jobId: schema,
      pollUrl: () => `/api/admin/pulsar/schema-provision?schema=${encodeURIComponent(schema)}`,
      intervalMs: 800,
      signal: controller.signal,
      isTerminal: (snapshot) => snapshot.status === "succeeded" || snapshot.status === "failed",
      formatProgressLine: (snapshot) => provisionPrimaryLine(snapshot, copy),
    });

    try {
      const result = await save();
      if (result.ok || result.errorCode === "schema_provision_failed") {
        await Promise.race([polling.catch(() => null), new Promise((resolve) => setTimeout(resolve, GRACE_MS))]);
      }
      if (result.ok || result.errorCode !== "schema_provision_failed") setOpen(false);
      return result;
    } finally {
      controller.abort();
      setIsRunning(false);
    }
  };

  const snapshot = poll.jobSnapshot;
  return {
    open,
    isRunning,
    setOpen,
    track,
    primaryLine: snapshot ? provisionPrimaryLine(snapshot, copy) : copy.schema,
    secondaryLine: snapshot ? countLine(snapshot, copy.count) : null,
    lines: provisionActivityLines(snapshot),
  };
}
