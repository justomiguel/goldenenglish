"use client";

import { LongJobActivityModal } from "@/components/molecules/LongJobActivityModal";
import { LongJobLoader } from "@/components/molecules/LongJobLoader";

export interface PulsarTenantProvisionDialogProps {
  open: boolean;
  isRunning: boolean;
  primaryLine: string;
  secondaryLine: string | null;
  lines: string[];
  title: string;
  intro: string;
  explain: string;
  logTitle: string;
  empty: string;
  running: string;
  closeLabel: string;
  onOpenChange: (open: boolean) => void;
}

export function PulsarTenantProvisionDialog({
  open,
  isRunning,
  primaryLine,
  secondaryLine,
  lines,
  title,
  intro,
  explain,
  logTitle,
  empty,
  running,
  closeLabel,
  onOpenChange,
}: PulsarTenantProvisionDialogProps) {
  if (!open) return null;
  return (
    <>
      <LongJobLoader
        isRunning={isRunning}
        runningAriaLabel={running}
        progressLine={primaryLine}
        statusMessage={isRunning ? null : primaryLine}
        errorDetail={null}
      />
      <LongJobActivityModal
        open={open}
        onOpenChange={onOpenChange}
        titleId="pulsar-tenant-provision-title"
        title={title}
        introLine={intro}
        primaryLine={primaryLine}
        secondaryLine={secondaryLine}
        explainBody={explain}
        logTitle={logTitle}
        lines={lines}
        emptyLogLine={empty}
        isRunning={isRunning}
        runningAriaLabel={running}
        closeLabel={closeLabel}
      />
    </>
  );
}
