import { ParentWardPicker, type ParentWardOption } from "@/components/parent/ParentWardPicker";
import type { StudentMiniTestAssessment } from "@/types/learningContent";
import type { Dictionary } from "@/types/i18n";

interface ParentAssessmentsScreenProps {
  locale: string;
  assessments: StudentMiniTestAssessment[];
  wardOptions: ParentWardOption[];
  selectedStudentId: string | null;
  parentLabels: Dictionary["dashboard"]["parent"];
  studentLabels: Dictionary["dashboard"]["student"];
}

export function ParentAssessmentsScreen({
  locale,
  assessments,
  wardOptions,
  selectedStudentId,
  parentLabels,
  studentLabels,
}: ParentAssessmentsScreenProps) {
  const basePath = `/${locale}/dashboard/parent/assessments`;
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
          {parentLabels.assessmentsPageTitle}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {parentLabels.assessmentsPageLead}
        </p>
      </header>

      <ParentWardPicker
        options={wardOptions}
        selectedStudentId={selectedStudentId}
        label={parentLabels.wardPickerLabel}
        hint={parentLabels.wardPickerHint}
        basePath={basePath}
      />

      {assessments.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {parentLabels.assessmentsPageEmpty}
        </p>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <ReadOnlyMiniTestCard
              key={assessment.id}
              assessment={assessment}
              parentLabels={parentLabels}
              studentLabels={studentLabels}
            />
          ))}
        </div>
      )}

      <p className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
        {parentLabels.assessmentsPageReadOnly}
      </p>
    </div>
  );
}

function ReadOnlyMiniTestCard({
  assessment,
  parentLabels,
  studentLabels,
}: {
  assessment: StudentMiniTestAssessment;
  parentLabels: Dictionary["dashboard"]["parent"];
  studentLabels: Dictionary["dashboard"]["student"];
}) {
  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {assessment.title}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {assessment.sectionName}
          </p>
        </div>
        {assessment.latestAttemptStatus ? (
          <span className="rounded-full border border-[var(--color-primary)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
            {parentLabels.assessmentsPageSubmitted}
          </span>
        ) : null}
      </div>
      <div className="mt-4 space-y-3">
        {assessment.questions.map((question) => (
          <div
            key={question.id}
            className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-3"
          >
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              {question.prompt}
            </p>
            <div className="mt-2 flex gap-4 text-sm text-[var(--color-muted-foreground)]">
              <span>{studentLabels.trueLabel}</span>
              <span>/</span>
              <span>{studentLabels.falseLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
