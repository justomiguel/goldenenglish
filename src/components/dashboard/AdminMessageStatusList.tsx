import type { Dictionary } from "@/types/i18n";
import type { AdminMessageStatusLine } from "@/lib/messaging/adminMessageStatus";

interface AdminMessageStatusListProps {
  locale: string;
  labels: Dictionary["admin"]["messages"];
  lines: AdminMessageStatusLine[];
  showHtml?: boolean;
}

function formatAt(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function lineLabel(line: AdminMessageStatusLine, labels: Dictionary["admin"]["messages"]): string {
  const name = line.actorName ?? "";
  if (line.kind === "unread") return labels.badgeUnread;
  if (line.kind === "read-only") return labels.statusReadOnly;
  if (line.kind === "portal-reply") return labels.statusPortalReply.replaceAll("{{name}}", name);
  if (line.kind === "email-reply") return labels.statusEmailReply.replaceAll("{{name}}", name);
  if (line.channel === "whatsapp") return labels.statusOpenedWhatsapp.replaceAll("{{name}}", name);
  if (line.channel === "gmail") return labels.statusOpenedGmail.replaceAll("{{name}}", name);
  if (line.channel === "outlook") return labels.statusOpenedOutlook.replaceAll("{{name}}", name);
  return labels.statusOpenedMail.replaceAll("{{name}}", name);
}

export function AdminMessageStatusList({
  locale,
  labels,
  lines,
  showHtml = false,
}: AdminMessageStatusListProps) {
  if (lines.length === 0) return null;

  return (
    <ul className="mt-2 space-y-1" aria-label={labels.statusListAria}>
      {lines.map((line, index) => {
        const when = line.at ? formatAt(line.at, locale) : "";
        return (
          <li key={`${line.kind}-${line.channel ?? ""}-${line.at ?? index}`} className="text-xs text-[var(--color-foreground)]">
            <p>
              {lineLabel(line, labels)}
              {when ? <span className="text-[var(--color-muted-foreground)]"> · {when}</span> : null}
            </p>
            {showHtml && line.html ? (
              <div
                className="mt-1 text-sm leading-relaxed text-[var(--color-foreground)] [&_p]:my-1"
                dangerouslySetInnerHTML={{ __html: line.html }}
              />
            ) : line.snippet ? (
              <p className="text-[var(--color-muted-foreground)]">{line.snippet}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
