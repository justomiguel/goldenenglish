"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  hrefWithPageTab,
  pageTabStorageKey,
  parsePersistentTab,
  readStoredPageTab,
  writeStoredPageTab,
} from "@/lib/navigation/persistentPageTab";

export interface UsePersistentPageTabOptions<T extends string> {
  allowed: readonly T[];
  fallback: T;
  /** Query key. Default `tab`. Use another key when the page already has `tab`. */
  param?: string;
}

/**
 * Remembers a page tab. A valid URL value wins. Otherwise the last value for
 * this path is restored from sessionStorage and written back to the URL.
 */
export function usePersistentPageTab<T extends string>({
  allowed,
  fallback,
  param = "tab",
}: UsePersistentPageTabOptions<T>): { value: T; setValue: (next: T) => void } {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const router = useRouter();
  const allowedKey = allowed.join("\u0001");
  const allowedRef = useRef(allowed);
  const routerRef = useRef(router);
  useEffect(() => {
    allowedRef.current = allowed;
    routerRef.current = router;
  }, [allowed, router]);
  const search = searchParams.toString();
  const fromUrl = parsePersistentTab(searchParams.get(param), allowed);
  const [stored, setStored] = useState<{ path: string; param: string; value: T | null } | null>(
    null,
  );
  const storedValue =
    stored && stored.path === pathname && stored.param === param ? stored.value : null;

  useEffect(() => {
    const ids = allowedRef.current;
    const key = pageTabStorageKey(pathname, param);
    const parsed = parsePersistentTab(readStoredPageTab(key), ids);
    setStored((prev) => {
      if (prev && prev.path === pathname && prev.param === param && prev.value === parsed) {
        return prev;
      }
      return { path: pathname, param, value: parsed };
    });
    if (fromUrl) {
      writeStoredPageTab(key, fromUrl);
      return;
    }
    if (parsed) {
      routerRef.current.replace(hrefWithPageTab(pathname, search, param, parsed), {
        scroll: false,
      });
    }
  }, [allowedKey, fromUrl, param, pathname, search]);

  const value = fromUrl ?? storedValue ?? fallback;

  const setValue = useCallback(
    (next: T) => {
      if (!allowed.includes(next)) return;
      const key = pageTabStorageKey(pathname, param);
      writeStoredPageTab(key, next);
      setStored({ path: pathname, param, value: next });
      if (searchParams.get(param) === next) return;
      router.replace(hrefWithPageTab(pathname, searchParams.toString(), param, next), {
        scroll: false,
      });
    },
    [allowed, param, pathname, router, searchParams],
  );

  return { value, setValue };
}
