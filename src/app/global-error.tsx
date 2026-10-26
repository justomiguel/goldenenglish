"use client";

import { PageErrorFallback } from "@/components/molecules/PageErrorFallback";
import "./globals.css";

export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <PageErrorFallback {...props} />
      </body>
    </html>
  );
}
