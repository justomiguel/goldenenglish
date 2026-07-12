import { BookOpen } from "lucide-react";
import { AdminHelpGlossaryPanel } from "@/components/dashboard/AdminHelpGlossaryPanel";
import type { Dictionary } from "@/types/i18n";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export interface AdminGlossaryScreenProps {
  pageDict: Dictionary["dashboard"]["adminGlossaryPage"];
  glossaryDict: Dictionary["dashboard"]["adminHelpGlossary"];
}

export function AdminGlossaryScreen({ pageDict, glossaryDict }: AdminGlossaryScreenProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6" data-tour={ADMIN_TOUR_ANCHORS.glossaryTitle}>
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
            <BookOpen className="h-5 w-5" aria-hidden strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-[var(--color-foreground)]">{pageDict.title}</h1>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              {pageDict.lead}
            </p>
          </div>
        </div>
      </header>
      <AdminHelpGlossaryPanel dict={glossaryDict} layout="page" />
    </div>
  );
}
