"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  archiveShopVariant,
  createShopProduct,
  deleteShopVariant,
  toggleShopProductActive,
  updateShopProduct,
  upsertShopVariant,
} from "@/app/[locale]/dashboard/admin/merch/actions";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { AdminMerchProductForm } from "@/components/dashboard/admin/merch/AdminMerchProductForm";
import { AdminMerchProductsTable } from "@/components/dashboard/admin/merch/AdminMerchProductsTable";
import { AdminMerchVariantEditor } from "@/components/dashboard/admin/merch/AdminMerchVariantEditor";
import {
  merchActionMessage,
  type AdminMerchLabels,
  type AdminMerchProductRow,
} from "@/components/dashboard/admin/merch/adminMerchTypes";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

interface AdminMerchProductsScreenProps {
  locale: string;
  initialRows: AdminMerchProductRow[];
  labels: AdminMerchLabels;
  fileUploadProgress: FileUploadProgressLabels;
}

export function AdminMerchProductsScreen({
  locale,
  initialRows,
  labels,
  fileUploadProgress,
}: AdminMerchProductsScreenProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => initialRows.find((row) => row.id === selectedId) ?? null,
    [initialRows, selectedId],
  );

  async function run(task: () => Promise<{ ok: true; id: string } | { ok: false; code: string }>) {
    setBusy(true);
    setMsg(null);
    const res = await task();
    setBusy(false);
    if (res.ok) {
      router.refresh();
      return { ok: true as const, id: res.id };
    }
    setMsg(merchActionMessage(res.code, labels));
    return res;
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader title={labels.title} lead={labels.lead} iconId="merch" />
      <p>
        <Link
          href={`/${locale}/dashboard/admin/merch/orders`}
          className="text-sm font-semibold text-[var(--color-primary)]"
        >
          {labels.ordersLink}
        </Link>
      </p>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
      <AdminMerchProductForm
        labels={labels}
        fileUploadProgress={fileUploadProgress}
        busy={busy}
        onCreate={async (input) => {
          const res = await run(() => createShopProduct({ locale, ...input }));
          if (res.ok) setSelectedId(res.id);
          return res.ok;
        }}
      />
      <AdminMerchProductsTable
        locale={locale}
        rows={initialRows}
        labels={labels}
        busy={busy}
        selectedId={selectedId}
        onEdit={setSelectedId}
        onToggle={(id, next) => {
          void run(() => toggleShopProductActive({ locale, id, active: next }));
        }}
      />
      {selected ? (
        <>
          <AdminMerchProductForm
            key={selected.id}
            labels={labels}
            fileUploadProgress={fileUploadProgress}
            product={selected}
            busy={busy}
            onUpdate={async (input) => {
              const res = await run(() => updateShopProduct({ locale, id: selected.id, ...input }));
              return res.ok;
            }}
          />
          <AdminMerchVariantEditor
            labels={labels}
            variants={selected.variants}
            busy={busy}
            onUpsert={async (input) => {
              const res = await run(() =>
                upsertShopVariant({ locale, productId: selected.id, ...input }),
              );
              return res.ok;
            }}
            onRemove={async (id) => {
              const res = await run(() => deleteShopVariant({ locale, id }));
              if (!res.ok && res.code === "archive_only") {
                const archived = await run(() => archiveShopVariant({ locale, id }));
                if (archived.ok) setMsg(labels.errorArchiveOnly);
              }
            }}
          />
        </>
      ) : null}
    </div>
  );
}
