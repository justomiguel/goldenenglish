import type { FleetSiteReview, FleetVercelState } from "@/lib/pulsar/fleetSiteReview";
import type { Dictionary } from "@/types/i18n";

type TableCopy = Dictionary["pulsar"]["admin"]["table"];

function fill(template: string, name: string, target: string): string {
  return template.replace("{name}", name).replace("{target}", target);
}

function vercelLabel(state: FleetVercelState, copy: TableCopy): string | null {
  if (state === "attached") return copy.vercelAttached;
  if (state === "missing") return copy.vercelMissing;
  if (state === "skipped") return copy.vercelSkipped;
  if (state === "failed") return copy.vercelFailed;
  return null;
}

export function PulsarAdminFleetHostLines({
  review,
  fallbackHosts,
  copy,
}: {
  review: FleetSiteReview | undefined;
  fallbackHosts: readonly string[];
  copy: TableCopy;
}) {
  if (!review) {
    return <span className="font-mono text-xs text-[var(--color-muted-foreground)]">{fallbackHosts.join(", ")}</span>;
  }
  return (
    <div className="space-y-2">
      {review.hosts.map((host) => {
        const dns =
          host.dnsKind === "a"
            ? fill(copy.dnsApex, host.dnsName, host.dnsTarget)
            : host.dnsKind === "cname"
              ? fill(copy.dnsCname, host.dnsName, host.dnsTarget)
              : "";
        const vercel = vercelLabel(host.vercel, copy);
        return (
          <div key={host.host}>
            <div className="text-[11px] text-[var(--color-muted-foreground)]">
              {host.role === "preview" ? copy.previewRole : copy.customRole}
            </div>
            <div className="font-mono text-xs text-[var(--color-foreground)]">{host.host}</div>
            {dns ? <div className="text-[11px] text-[var(--color-muted-foreground)]">{dns}</div> : null}
            {vercel ? <div className="text-[11px] text-[var(--color-foreground)]">{vercel}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
