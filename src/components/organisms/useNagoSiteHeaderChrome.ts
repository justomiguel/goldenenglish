"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { resolveNagoNavActiveHref } from "@/lib/landing/nagoNavActiveHref";

export function useNagoSiteHeaderChrome(locale: string) {
  const [intersectingIds, setIntersectingIds] = useState<string[]>([]);
  const [spacerPx, setSpacerPx] = useState(96);
  const barRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() ?? `/${locale}`;
  const navReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const scrolled = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("scroll", onStoreChange, { passive: true });
      return () => window.removeEventListener("scroll", onStoreChange);
    },
    () => window.scrollY > 24,
    () => false,
  );

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const sync = () => setSpacerPx(el.offsetHeight);
    sync();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ids = ["top", "sobre", "principios", "galeria", "contacto"];
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node != null);
    if (nodes.length === 0 || typeof IntersectionObserver === "undefined") return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        setIntersectingIds([...visible]);
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: 0 },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [pathname]);

  const activeHref = navReady
    ? resolveNagoNavActiveHref({ locale, pathname, intersectingIds })
    : "";

  return { barRef, spacerPx, scrolled, activeHref };
}
