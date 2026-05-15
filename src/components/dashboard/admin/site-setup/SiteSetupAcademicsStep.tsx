"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { SiteSetupOperationalValues } from "@/lib/site/loadSiteSetupCurrentValues";

type L = Dictionary["dashboard"]["siteSetup"]["academics"];

interface SiteSetupAcademicsStepProps {
  labels: L;
  operational: SiteSetupOperationalValues;
  update: <K extends keyof SiteSetupOperationalValues>(
    key: K,
    value: SiteSetupOperationalValues[K],
  ) => void;
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function NumberField({ id, label, value, onChange }: NumberFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="mt-1"
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function SiteSetupAcademicsStep({
  labels,
  operational,
  update,
}: SiteSetupAcademicsStepProps) {
  const [advanced, setAdvanced] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap
          className="h-5 w-5 text-[var(--color-primary)]"
          aria-hidden
        />
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          {labels.title}
        </h2>
      </div>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {labels.lead}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          id="academics-max-students"
          label={labels.sectionMaxStudents}
          value={operational.academicsSectionMaxStudents}
          onChange={(v) => update("academicsSectionMaxStudents", v)}
        />
        <div>
          <Label htmlFor="academics-roles">
            {labels.teacherPortalAllowedProfileRoles}
          </Label>
          <Input
            id="academics-roles"
            className="mt-1"
            value={operational.academicsTeacherPortalRoles}
            onChange={(e) =>
              update("academicsTeacherPortalRoles", e.target.value)
            }
            placeholder="teacher,assistant"
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {labels.teacherPortalAllowedProfileRolesHint}
          </p>
        </div>
      </div>

      <div>
        <button
          type="button"
          className="text-sm font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
          onClick={() => setAdvanced((v) => !v)}
          aria-expanded={advanced}
          aria-controls="academics-advanced"
        >
          {advanced ? labels.advancedHide : labels.advancedShow}
        </button>
      </div>

      {advanced ? (
        <div id="academics-advanced" className="grid gap-3 sm:grid-cols-2">
          <NumberField
            id="att-teacher-buffer"
            label={labels.attendanceTeacherScanLookbackBufferDays}
            value={operational.attendanceTeacherScanLookbackBufferDays}
            onChange={(v) =>
              update("attendanceTeacherScanLookbackBufferDays", v)
            }
          />
          <NumberField
            id="att-teacher-lookback"
            label={labels.attendanceTeacherOperationalCivilLookbackDays}
            value={operational.attendanceTeacherOperationalCivilLookbackDays}
            onChange={(v) =>
              update("attendanceTeacherOperationalCivilLookbackDays", v)
            }
          />
          <NumberField
            id="att-teacher-op-max"
            label={labels.attendanceTeacherOperationalMaxClassDays}
            value={operational.attendanceTeacherOperationalMaxClassDays}
            onChange={(v) =>
              update("attendanceTeacherOperationalMaxClassDays", v)
            }
          />
          <NumberField
            id="att-teacher-full"
            label={labels.attendanceTeacherFullCourseMaxClassDays}
            value={operational.attendanceTeacherFullCourseMaxClassDays}
            onChange={(v) =>
              update("attendanceTeacherFullCourseMaxClassDays", v)
            }
          />
          <NumberField
            id="att-admin-fallback"
            label={labels.attendanceAdminFallbackLookbackDays}
            value={operational.attendanceAdminFallbackLookbackDays}
            onChange={(v) => update("attendanceAdminFallbackLookbackDays", v)}
          />
          <NumberField
            id="att-admin-max"
            label={labels.attendanceAdminMaxClassDays}
            value={operational.attendanceAdminMaxClassDays}
            onChange={(v) => update("attendanceAdminMaxClassDays", v)}
          />
          <NumberField
            id="att-pick-adj"
            label={labels.attendancePickAdjacentCivilDays}
            value={operational.attendancePickAdjacentCivilDays}
            onChange={(v) => update("attendancePickAdjacentCivilDays", v)}
          />
          <NumberField
            id="att-eligible-max"
            label={labels.attendanceHasEligibleWindowMaxScans}
            value={operational.attendanceHasEligibleWindowMaxScans}
            onChange={(v) =>
              update("attendanceHasEligibleWindowMaxScans", v)
            }
          />
        </div>
      ) : null}
    </div>
  );
}
