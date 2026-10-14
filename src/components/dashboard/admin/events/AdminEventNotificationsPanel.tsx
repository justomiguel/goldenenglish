import { EventEmailTemplateEditor } from "@/components/dashboard/admin/events/EventEmailTemplateEditor";
import type { EventEmailTemplateLabels } from "@/components/dashboard/admin/events/EventEmailTemplateEditor";
import type { EmailTemplateBodyFieldLabels } from "@/components/molecules/EmailTemplateBodyField";
import { loadEventEmailEditorModel } from "@/lib/events/server/loadEventEmailEditorModel";

interface AdminEventNotificationsPanelProps {
  eventId: string;
  pageLocale: string;
  flows: { id: string; name: string }[];
  lead: string;
  labels: EventEmailTemplateLabels;
  bodyField: EmailTemplateBodyFieldLabels;
}

export async function AdminEventNotificationsPanel({
  eventId,
  pageLocale,
  flows,
  lead,
  labels,
  bodyField,
}: AdminEventNotificationsPanelProps) {
  const model = await loadEventEmailEditorModel(eventId);

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
      <p className="text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      <EventEmailTemplateEditor
        eventId={eventId}
        pageLocale={pageLocale}
        flows={flows}
        copies={model.copies}
        fallbacks={model.fallbacks}
        bodyField={bodyField}
        labels={labels}
      />
    </section>
  );
}
