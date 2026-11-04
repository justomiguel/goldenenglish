"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAppSurface } from "@/hooks/useAppSurface";

export function TemplateThumbCta({ label }: { label: string }) {
  const surface = useAppSurface();
  const [contactVisible, setContactVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("contacto");
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setContactVisible(entry?.isIntersecting === true),
      { threshold: 0.25 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (surface === "web-desktop" || contactVisible) return null;

  return (
    <>
      <div aria-hidden className="h-16" />
      <a
        href="#contacto"
        className="fixed inset-x-0 bottom-0 z-50 inline-flex min-h-14 items-center justify-center gap-2 bg-[var(--color-primary)] px-4 text-base font-semibold text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)]"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <ArrowRight className="h-4 w-4" aria-hidden />
        {label}
      </a>
    </>
  );
}
