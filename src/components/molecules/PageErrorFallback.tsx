"use client";

import { useEffect, useSyncExternalStore } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import pt from "@/dictionaries/pt.json";
import { logClientException } from "@/lib/logging/clientLog";

const copyByLocale = {
  es: es.common.pageError,
  en: en.common.pageError,
  pt: pt.common.pageError,
};

function subscribePath(): () => void {
  return () => {};
}

function readBrowserPath(): string {
  return window.location.pathname;
}

function readServerPath(): string {
  return "";
}

function localeFromPath(path: string): keyof typeof copyByLocale {
  const segment = path.split("/")[1];
  if (segment === "en" || segment === "pt") return segment;
  return "es";
}

export function PageErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const path = useSyncExternalStore(subscribePath, readBrowserPath, readServerPath);

  useEffect(() => {
    logClientException("page.error_boundary", error, {
      digest: error.digest ?? null,
      path: window.location.pathname,
    });
  }, [error]);

  const copy = copyByLocale[localeFromPath(path)];

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{copy.title}</h1>
      <p className="max-w-md text-[var(--color-foreground)]">{copy.body}</p>
      {error.digest ? (
        <p className="text-sm text-[var(--color-foreground)]">
          {copy.supportCode}: {error.digest}
        </p>
      ) : null}
      <Button type="button" onClick={() => reset()} className="min-h-11">
        <RefreshCw className="h-4 w-4" aria-hidden />
        {copy.retry}
      </Button>
    </div>
  );
}
