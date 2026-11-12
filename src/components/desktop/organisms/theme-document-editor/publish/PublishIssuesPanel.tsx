import { AlertCircle } from "lucide-react";
import { themeDocumentIssueMessage } from "@/lib/theme-document/themeDocumentIssueMessage";

export function PublishIssuesPanel({
  issues,
  messages,
  onOpenField,
}: {
  issues: readonly { code: string; path?: string }[];
  messages: Record<string, string>;
  onOpenField: (path: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {issues.map((issue) => {
        const text = themeDocumentIssueMessage(messages, issue.code, { path: issue.path });
        return (
          <li key={`${issue.code}:${issue.path ?? ""}`}>
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center gap-2 text-left text-sm text-[var(--color-foreground)]"
              onClick={() => onOpenField(issue.path ?? "")}
            >
              <AlertCircle className="h-4 w-4" aria-hidden />
              {text}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
