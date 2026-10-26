"use client";

import { PageErrorFallback } from "@/components/molecules/PageErrorFallback";

export default function LocaleError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PageErrorFallback {...props} />;
}
