"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { RichContentPdfViewerLabels } from "@/lib/rich-content/richContentDisplayTypes";

const LOAD_TIMEOUT_MS = 20_000;

const linkButtonClassName =
  "inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border)] focus-visible:ring-offset-2";

interface PdfDocumentViewerProps {
  fileUrl: string;
  documentTitle: string;
  labels: RichContentPdfViewerLabels;
}

function PdfDocumentViewerFrame({ fileUrl, documentTitle, labels }: PdfDocumentViewerProps) {
  const loadTimeoutRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    loadTimeoutRef.current = window.setTimeout(() => {
      setLoadError(true);
      setIsLoading(false);
    }, LOAD_TIMEOUT_MS);

    return () => {
      if (loadTimeoutRef.current !== null) {
        window.clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  const clearLoadTimeout = () => {
    if (loadTimeoutRef.current !== null) {
      window.clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  };

  const handleIframeLoad = () => {
    clearLoadTimeout();
    setIsLoading(false);
    setLoadError(false);
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={linkButtonClassName}>
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          {labels.openInNewTab}
        </a>
      </div>

      <div
        className="relative min-h-[50dvh] overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/30"
        aria-busy={isLoading}
      >
        {isLoading && !loadError ? (
          <p className="absolute inset-0 z-10 flex items-center justify-center p-4 text-sm text-[var(--color-muted-foreground)]">
            {labels.loading}
          </p>
        ) : null}
        {loadError ? (
          <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-[var(--color-error)]">{labels.loadError}</p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${linkButtonClassName} bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-dark)]`}
            >
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              {labels.openInNewTab}
            </a>
          </div>
        ) : (
          <iframe
            key={fileUrl}
            src={fileUrl}
            title={documentTitle}
            className="h-[min(75dvh,720px)] w-full bg-[var(--color-surface)]"
            onLoad={handleIframeLoad}
          />
        )}
      </div>
    </div>
  );
}

export function PdfDocumentViewer(props: PdfDocumentViewerProps) {
  return <PdfDocumentViewerFrame key={props.fileUrl} {...props} />;
}
