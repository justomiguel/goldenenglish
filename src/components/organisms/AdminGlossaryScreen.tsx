import { AdminHelpGlossaryPanel } from "@/components/dashboard/AdminHelpGlossaryPanel";
import type { Dictionary } from "@/types/i18n";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

export interface AdminGlossaryScreenProps {
  pageDict: Dictionary["dashboard"]["adminGlossaryPage"];
  glossaryDict: Dictionary["dashboard"]["adminHelpGlossary"];
}

export function AdminGlossaryScreen({ pageDict, glossaryDict }: AdminGlossaryScreenProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <AdminPageHeader
          title={pageDict.title}
          lead={pageDict.lead}
          iconId="glossary"
          tourAnchor={ADMIN_TOUR_ANCHORS.glossaryTitle}
        />
      </div>
      <AdminHelpGlossaryPanel dict={glossaryDict} layout="page" />
    </div>
  );
}
