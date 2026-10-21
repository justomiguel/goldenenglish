"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import {
  StudentMessagesClient,
  type StudentMessageLineDto,
} from "@/components/student/StudentMessagesClient";
import type { Dictionary } from "@/types/i18n";

function MessagesSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-10 max-w-md rounded bg-[var(--color-muted)]" />
      <div className="h-32 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}

export interface StudentMessagesEntryProps {
  locale: string;
  title: string;
  lead: string;
  lines: StudentMessageLineDto[];
  teacherComposeAvailable: boolean;
  administrationComposeAvailable: boolean;
  labels: Dictionary["dashboard"]["student"];
}

export function StudentMessagesEntry({
  locale,
  title,
  lead,
  lines,
  teacherComposeAvailable,
  administrationComposeAvailable,
  labels,
}: StudentMessagesEntryProps) {
  const clientProps = {
    locale,
    initialLines: lines,
    teacherComposeAvailable,
    administrationComposeAvailable,
    labels,
  };

  return (
    <SurfaceMountGate
      skeleton={<MessagesSkeleton />}
      desktop={
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--color-secondary)]">{title}</h1>
          <p className="mt-2 text-[var(--color-muted-foreground)]">{lead}</p>
          <StudentMessagesClient {...clientProps} />
        </div>
      }
      narrow={() => (
        <StudentMessagesClient {...clientProps} layout="thread" />
      )}
    />
  );
}
