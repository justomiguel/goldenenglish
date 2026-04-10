import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminRegistrationsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  void locale;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const list = rows ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
        {dict.admin.registrations.title}
      </h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        {dict.admin.registrations.lead}
      </p>
      {list.length === 0 ? (
        <p className="mt-8 text-[var(--color-muted-foreground)]">
          {dict.admin.registrations.none}
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--color-muted)]/50 text-xs uppercase text-[var(--color-muted-foreground)]">
              <tr>
                <th className="px-3 py-2">{dict.admin.registrations.name}</th>
                <th className="px-3 py-2">{dict.admin.registrations.dni}</th>
                <th className="px-3 py-2">{dict.admin.registrations.email}</th>
                <th className="px-3 py-2">{dict.admin.registrations.level}</th>
                <th className="px-3 py-2">{dict.admin.registrations.status}</th>
                <th className="px-3 py-2">{dict.admin.registrations.received}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const id = r.id as string;
                const status = String(r.status ?? "");
                return (
                  <tr key={id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2 font-medium">
                      {String(r.first_name)} {String(r.last_name)}
                    </td>
                    <td className="px-3 py-2">{String(r.dni)}</td>
                    <td className="px-3 py-2">{String(r.email)}</td>
                    <td className="px-3 py-2">{r.level_interest ? String(r.level_interest) : "—"}</td>
                    <td className="px-3 py-2">
                      {status === "new" ? (
                        <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[0.7rem] font-bold text-[var(--color-accent-foreground)]">
                          {dict.admin.registrations.new}
                        </span>
                      ) : (
                        status
                      )}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                      {r.created_at
                        ? new Date(String(r.created_at)).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
