"use client";

import { useRef } from "react";
import Image from "next/image";
import styles from "@/components/organisms/pulsar/centrolistoMotion.module.css";
import { PulsarBrowserShot } from "@/components/organisms/pulsar/PulsarBrowserShot";

export interface PulsarHeroStageProps {
  editorialAlt: string;
  dashboardAlt: string;
  siteAlt: string;
}

export function PulsarHeroStage({ editorialAlt, dashboardAlt, siteAlt }: PulsarHeroStageProps) {
  const stage = useRef<HTMLDivElement>(null);

  function onMove(event: React.MouseEvent<HTMLDivElement>) {
    const node = stage.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.setProperty("--cl-x", x.toFixed(3));
    node.style.setProperty("--cl-y", y.toFixed(3));
  }

  function onLeave() {
    stage.current?.style.setProperty("--cl-x", "0");
    stage.current?.style.setProperty("--cl-y", "0");
  }

  return (
    <div
      ref={stage}
      className={`${styles.heroStage} relative min-h-[22rem]`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <figure className={`${styles.heroDepth} relative aspect-[4/3] overflow-hidden rounded-[var(--layout-border-radius)]`}>
        <Image
          src="/centrolisto/marketing/hero-editorial.jpg"
          alt={editorialAlt}
          fill
          priority
          sizes="(min-width: 1024px) 36rem, 100vw"
          className="object-cover"
        />
      </figure>
      <div className={`${styles.heroCard} absolute -left-2 bottom-6 hidden w-[58%] sm:block`}>
        <PulsarBrowserShot src="/centrolisto/product/admin-hub.jpg" alt={dashboardAlt} priority />
      </div>
      <div className={`${styles.heroCardFar} absolute -right-2 top-6 hidden w-[42%] md:block`}>
        <PulsarBrowserShot src="/centrolisto/product/public-site.jpg" alt={siteAlt} />
      </div>
    </div>
  );
}
