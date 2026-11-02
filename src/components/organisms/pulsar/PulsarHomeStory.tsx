"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { PulsarBrowserShot } from "@/components/organisms/pulsar/PulsarBrowserShot";
import styles from "@/components/organisms/pulsar/centrolistoMotion.module.css";

export interface PulsarHomeStoryProps {
  dict: Dictionary;
}

const STILLS = [
  "/centrolisto/product/public-site.jpg",
  "/centrolisto/product/admin-hub.jpg",
  "/centrolisto/product/admin-hub.jpg",
] as const;

export function PulsarHomeStory({ dict }: PulsarHomeStoryProps) {
  const copy = dict.pulsar.solutions;
  const [active, setActive] = useState(0);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-cl-story]"));
    if (nodes.length === 0 || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const index = Number(visible?.target.getAttribute("data-cl-story"));
        if (Number.isInteger(index)) setActive(index);
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: [0.2, 0.6] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="plataforma" className="border-b border-[var(--color-border)] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-3xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)] md:text-4xl">
          {copy.storyTitle}
        </h2>
        <div className="mt-12 lg:grid lg:grid-cols-2 lg:gap-16">
          <div className="hidden lg:block">
            <div className="sticky top-24">
              {STILLS.map((src, index) => (
                <div key={src + index} className={index === active ? styles.storyOn : undefined} hidden={index !== active}>
                  <PulsarBrowserShot src={src} alt={copy.moments[index]?.title ?? copy.publicSiteAlt} />
                </div>
              ))}
            </div>
          </div>
          <ol>
            {copy.moments.map((moment, index) => (
              <li key={moment.title} data-cl-story={index} className="border-t border-[var(--color-border)] py-12 lg:min-h-[70vh]">
                <div className="mb-6 lg:hidden">
                  <PulsarBrowserShot src={STILLS[index] ?? STILLS[0]} alt={moment.title} />
                </div>
                <p className="font-display text-sm text-[var(--color-muted-foreground)]">0{index + 1}</p>
                <h3 className="mt-2 font-display text-3xl font-medium text-[var(--color-foreground)]">{moment.title}</h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--color-foreground)]">{moment.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
