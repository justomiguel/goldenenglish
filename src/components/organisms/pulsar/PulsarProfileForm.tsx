"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { savePulsarProfileAction } from "@/app/[locale]/cuenta/profileActions";
import { Button } from "@/components/atoms/Button";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import { readImageFileAsBase64 } from "@/components/dashboard/admin/site-setup/readImageFileAsBase64";
import type { Dictionary } from "@/types/i18n";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-base text-[var(--color-foreground)]";

export function PulsarProfileForm({
  locale,
  email,
  displayName,
  phone,
  avatarUrl,
  copy,
}: {
  locale: string;
  email: string;
  displayName: string;
  phone: string;
  avatarUrl: string | null;
  copy: Dictionary["pulsar"]["profile"];
}) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [personPhone, setPersonPhone] = useState(phone);
  const [photo, setPhoto] = useState<{ base64: string; mime: string } | null>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [readProgress, setReadProgress] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setError(null);
    setReadProgress(0);
    try {
      const read = await readImageFileAsBase64(file, {
        onProgress: (value) => setReadProgress(Math.round(value * 100)),
      });
      setPhoto(read);
      setPreview(`data:${read.mime};base64,${read.base64}`);
    } catch {
      setError(copy.invalidPhoto);
    } finally {
      setReadProgress(null);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    setMessage(null);
    const result = await savePulsarProfileAction({
      locale,
      displayName: name,
      phone: personPhone,
      photoBase64: photo?.base64,
      photoMime: photo?.mime,
    });
    setSending(false);
    if (!result.ok) {
      if (result.errorCode === "invalid_name") setError(copy.invalidName);
      else if (result.errorCode === "invalid_phone") setError(copy.invalidPhone);
      else if (result.errorCode === "invalid_photo") setError(copy.invalidPhoto);
      else if (result.errorCode === "session") setError(copy.sessionExpired);
      else setError(copy.saveFailed);
      return;
    }
    setMessage(copy.saved);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4 px-5 py-10">
      <h1 className="text-2xl font-medium">{copy.title}</h1>
      <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">{copy.lead}</p>
      <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">{copy.contactNote}</p>
      {preview ? (
        <img src={preview} alt={copy.photo} className="h-20 w-20 rounded-full object-cover" />
      ) : null}
      <label className="block text-sm font-semibold" htmlFor="profile-photo">
        {copy.photo}
        <input
          id="profile-photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-1 block w-full text-sm"
          onChange={(event) => void onPhoto(event.target.files?.[0])}
        />
      </label>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.photoHint}</p>
      <InlineUploadProgressBar
        label={sending ? copy.uploadSending : readProgress !== null ? copy.uploadReading : copy.photoHint}
        {...(sending ? { indeterminate: true } : { value: readProgress ?? 0 })}
      />
      <label className="block text-sm font-semibold" htmlFor="profile-name">
        {copy.displayName}
        <input
          id="profile-name"
          name="displayName"
          value={name}
          required
          maxLength={80}
          className={fieldClass}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor="profile-phone">
        {copy.phone}
        <input
          id="profile-phone"
          name="phone"
          type="tel"
          value={personPhone}
          maxLength={40}
          className={fieldClass}
          onChange={(event) => setPersonPhone(event.target.value)}
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor="profile-email">
        {copy.email}
        <input id="profile-email" value={email} readOnly className={fieldClass} />
      </label>
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--color-foreground)]">{message}</p> : null}
      <Button type="submit" isLoading={sending} className="min-h-11">
        <Save className="h-4 w-4" aria-hidden />
        {copy.save}
      </Button>
    </form>
  );
}
