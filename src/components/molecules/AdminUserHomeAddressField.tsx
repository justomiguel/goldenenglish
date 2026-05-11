"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary, Locale } from "@/types/i18n";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import { AdminUserHomeAddressFamilyApplyModal } from "@/components/molecules/AdminUserHomeAddressFamilyApplyModal";
import { AdminUserHomeAddressFieldEditPanel } from "@/components/molecules/AdminUserHomeAddressFieldEditPanel";
import { AdminUserHomeAddressFieldReadPanel } from "@/components/molecules/AdminUserHomeAddressFieldReadPanel";
import { updateAdminUserDetailHomeAddressAction } from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";
import { googleMapsSearchUrl } from "@/lib/maps/googleMapsSearchUrl";
import { readGoogleMapsBrowserKey } from "@/lib/site/googleMapsBrowserKey";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserHomeAddressFieldProps {
  locale: Locale;
  userId: string;
  detail: AdminUserDetailVM;
  labels: UserLabels;
  editable: boolean;
  onFeedback: (text: string, ok: boolean) => void;
}

export function AdminUserHomeAddressField({
  locale,
  userId,
  detail,
  labels,
  editable,
  onFeedback,
}: AdminUserHomeAddressFieldProps) {
  const router = useRouter();
  const mapsKey = readGoogleMapsBrowserKey();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [familyPromptOpen, setFamilyPromptOpen] = useState(false);
  const [draftText, setDraftText] = useState(detail.homeAddressText);
  const [draftPlaceId, setDraftPlaceId] = useState(detail.homePlaceId ?? "");

  const peerCount = detail.familyHomeAddressPeerIds.length;

  const mapLabels = useMemo(
    () => ({
      mapPreviewEmpty: labels.detailHomeAddressMapPreviewEmpty,
      mapPreviewLoading: labels.detailHomeAddressMapPreviewLoading,
      mapPreviewUnavailable: labels.detailHomeAddressMapPreviewUnavailable,
    }),
    [
      labels.detailHomeAddressMapPreviewEmpty,
      labels.detailHomeAddressMapPreviewLoading,
      labels.detailHomeAddressMapPreviewUnavailable,
    ],
  );

  useEffect(() => {
    if (!editing) {
      setDraftText(detail.homeAddressText);
      setDraftPlaceId(detail.homePlaceId ?? "");
    }
  }, [detail.homeAddressText, detail.homePlaceId, editing]);

  const display =
    detail.homeAddressText.trim().length > 0 ? detail.homeAddressText.trim() : labels.detailNoValue;
  const mapsHref = googleMapsSearchUrl(detail.homeAddressText, detail.homePlaceId);

  const startEdit = useCallback(() => {
    setDraftText(detail.homeAddressText);
    setDraftPlaceId(detail.homePlaceId ?? "");
    setEditing(true);
  }, [detail.homeAddressText, detail.homePlaceId]);

  const cancel = useCallback(() => {
    setEditing(false);
    setDraftText(detail.homeAddressText);
    setDraftPlaceId(detail.homePlaceId ?? "");
  }, [detail.homeAddressText, detail.homePlaceId]);

  const saveInner = useCallback(
    async (applyToFamily: boolean) => {
      setBusy(true);
      try {
        const r = await updateAdminUserDetailHomeAddressAction({
          locale,
          targetUserId: userId,
          homeAddressText: draftText,
          homePlaceId: draftPlaceId.trim().length > 0 ? draftPlaceId.trim() : null,
          applyToFamily,
        });
        if (r.ok) {
          onFeedback(r.message ?? labels.detailToastSaved, true);
          setEditing(false);
          setFamilyPromptOpen(false);
          router.refresh();
        } else {
          onFeedback(r.message ?? labels.detailErrSave, false);
        }
      } finally {
        setBusy(false);
      }
    },
    [
      draftPlaceId,
      draftText,
      labels.detailErrSave,
      labels.detailToastSaved,
      locale,
      onFeedback,
      router,
      userId,
    ],
  );

  const needsFamilyPrompt = editable && peerCount > 0 && draftText.trim().length > 0;

  const requestSave = useCallback(() => {
    if (needsFamilyPrompt) {
      setFamilyPromptOpen(true);
      return;
    }
    void saveInner(false);
  }, [needsFamilyPrompt, saveInner]);

  return (
    <div className="border-b border-[var(--color-border)] py-3 last:border-0">
      <AdminUserHomeAddressFamilyApplyModal
        open={familyPromptOpen}
        onOpenChange={setFamilyPromptOpen}
        peerCount={peerCount}
        labels={labels}
        busy={busy}
        onApplySingle={() => void saveInner(false)}
        onApplyFamily={() => void saveInner(true)}
      />
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {labels.detailFieldHomeAddress}
      </dt>
      {editing ? (
        <AdminUserHomeAddressFieldEditPanel
          userId={userId}
          mapsKey={mapsKey}
          busy={busy}
          draftText={draftText}
          draftPlaceId={draftPlaceId}
          labels={labels}
          mapLabels={mapLabels}
          onDraftTextChange={(next) => {
            setDraftText(next);
            setDraftPlaceId("");
          }}
          onResolvedPlace={(formattedAddress, placeId) => {
            setDraftText(formattedAddress);
            setDraftPlaceId(placeId);
          }}
          onSave={() => void requestSave()}
          onCancel={cancel}
        />
      ) : (
        <AdminUserHomeAddressFieldReadPanel
          mapsKey={mapsKey}
          editable={editable}
          display={display}
          homeAddressText={detail.homeAddressText}
          homePlaceId={detail.homePlaceId}
          mapsHref={mapsHref}
          labels={labels}
          mapLabels={mapLabels}
          onStartEdit={startEdit}
        />
      )}
    </div>
  );
}
