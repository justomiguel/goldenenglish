"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RegistrationMatriculaPayLeave({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setTimeout(() => {
      router.push(href);
    }, 1600);
    return () => window.clearTimeout(id);
  }, [href, router]);
  return <p className="mt-4 text-sm">{label}</p>;
}
