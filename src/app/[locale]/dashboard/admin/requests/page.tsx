import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import type { AcademicTransferNotificationDict } from "@/app/[locale]/dashboard/admin/academic/transferActions";
import {
  AcademicTransferInboxTable,
  type TransferInboxRow,
} from "@/components/organisms/AcademicTransferInboxTable";

interface PageProps {
  params: Promise<{ locale: string }>;
}

function labelFromProfile(p: { first_name: string; last_name: string } | null | undefined, id: string) {
  if (!p) return id;
  const s = `${p.first_name} ${p.last_name}`.trim();
  return s || id;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.academicRequests.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AdminTransferRequestsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.academicRequests;
  const supabase = await createClient();

  const { data: reqs } = await supabase
    .from("section_transfer_requests")
    .select("id, student_id, from_section_id, to_section_id, requested_by, note, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const list = reqs ?? [];
  const profileIds = new Set<string>();
  const sectionIds = new Set<string>();
  for (const r of list) {
    profileIds.add(r.student_id as string);
    profileIds.add(r.requested_by as string);
    sectionIds.add(r.from_section_id as string);
    sectionIds.add(r.to_section_id as string);
  }

  const [{ data: profiles }, { data: sections }] =
    profileIds.size === 0 || sectionIds.size === 0
      ? [{ data: [] }, { data: [] }]
      : await Promise.all([
          supabase.from("profiles").select("id, first_name, last_name").in("id", [...profileIds]),
          supabase
            .from("academic_sections")
            .select("id, name, academic_cohorts(name)")
            .in("id", [...sectionIds]),
        ]);

  const profMap = new Map(
    (profiles ?? []).map((p) => {
      const row = p as { id: string; first_name: string; last_name: string };
      return [row.id, row];
    }),
  );
  const secMap = new Map(
    (sections ?? []).map((s) => {
      const row = s as {
        id: string;
        name: string;
        academic_cohorts: { name: string } | { name: string }[] | null;
      };
      const c = row.academic_cohorts;
      const cn = Array.isArray(c) ? (c[0]?.name ?? "") : (c?.name ?? "");
      return [row.id, `${cn} — ${row.name}`];
    }),
  );

  const df = new Intl.DateTimeFormat(locale === "es" ? "es" : "en", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const rows: TransferInboxRow[] = list.map((raw) => {
    const r = raw as {
      id: string;
      student_id: string;
      from_section_id: string;
      to_section_id: string;
      requested_by: string;
      note: string | null;
      created_at: string;
    };
    return {
      id: r.id,
      studentLabel: labelFromProfile(profMap.get(r.student_id), r.student_id),
      fromLabel: secMap.get(r.from_section_id) ?? r.from_section_id,
      toLabel: secMap.get(r.to_section_id) ?? r.to_section_id,
      byLabel: labelFromProfile(profMap.get(r.requested_by), r.requested_by),
      note: r.note,
      createdAt: df.format(new Date(r.created_at)),
    };
  });

  const tn = dict.dashboard.academics.transferNotifications;
  const notificationDict: AcademicTransferNotificationDict = {
    emailSubject: tn.emailSubject,
    emailLead: tn.emailLead,
    inAppTitle: tn.inAppTitle,
    inAppBody: tn.inAppBody,
  };

  return (
    <div className="space-y-8">
      <div className="min-w-0">
        <Link
          href={`/${locale}/dashboard/admin/academic`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {d.backHub}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{d.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted-foreground)]">{d.lead}</p>
      </div>
      <AcademicTransferInboxTable
        locale={locale}
        rows={rows}
        dict={d}
        notificationDict={notificationDict}
      />
    </div>
  );
}
