import type { Dictionary } from "@/types/i18n";

export interface AdminMessageRow {
  id: string;
  fromName: string;
  toName: string;
  fromRole: string;
  toRole: string;
  createdAt: string;
  preview: string;
}

interface AdminMessagesInboxProps {
  locale: string;
  labels: Dictionary["admin"]["messages"];
  rows: AdminMessageRow[];
}

function formatSentAt(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function AdminMessagesInbox({ locale, labels, rows }: AdminMessagesInboxProps) {
  if (rows.length === 0) {
    return (
      <p className="mt-8 text-[var(--color-muted-foreground)]">{labels.empty}</p>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-foreground)]">
            <th className="py-3 pr-4 font-medium">{labels.colFrom}</th>
            <th className="py-3 pr-4 font-medium">{labels.colTo}</th>
            <th className="py-3 pr-4 font-medium">{labels.colFromRole}</th>
            <th className="py-3 pr-4 font-medium">{labels.colToRole}</th>
            <th className="py-3 pr-4 font-medium">{labels.colSent}</th>
            <th className="py-3 font-medium">{labels.preview}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[var(--color-border)] align-top last:border-0"
            >
              <td className="py-3 pr-4 font-medium text-[var(--color-foreground)]">
                {row.fromName}
              </td>
              <td className="py-3 pr-4 text-[var(--color-foreground)]">{row.toName}</td>
              <td className="py-3 pr-4 text-[var(--color-muted-foreground)]">{row.fromRole}</td>
              <td className="py-3 pr-4 text-[var(--color-muted-foreground)]">{row.toRole}</td>
              <td className="py-3 pr-4 whitespace-nowrap text-[var(--color-muted-foreground)]">
                {formatSentAt(row.createdAt, locale)}
              </td>
              <td className="py-3 text-[var(--color-muted-foreground)]">{row.preview}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
