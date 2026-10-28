"use client";

import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export interface PulsarInteractivePortalShowcaseProps {
  dict: Dictionary;
}

export function PulsarInteractivePortalShowcase({
  dict,
}: PulsarInteractivePortalShowcaseProps) {
  const portals = dict.pulsar.home.portals;
  const tabs = portals.tabs;
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoSurface, setVideoSurface] = useState<"desktop" | "mobile">("desktop");
  const currentTab = tabs[activeIndex] ?? tabs[0];
  const videoSrc = `/videos/centrolisto/flow-${activeIndex}-${videoSurface}.webm`;

  return (
    <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="font-display text-sm italic text-[var(--color-muted-foreground)]">
          {portals.eyebrow}
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
          {portals.title}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
          {portals.lead}
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          <div
            role="tablist"
            aria-label={portals.title}
            className="flex flex-col gap-1 lg:col-span-4"
          >
            {tabs.map((tab, index) => {
              const isSelected = index === activeIndex;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`portal-tab-${tab.id}`}
                  aria-selected={isSelected}
                  aria-controls={`portal-panel-${tab.id}`}
                  aria-label={tab.label}
                  onClick={() => setActiveIndex(index)}
                  className={`min-h-[52px] border-l-2 px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-muted)]"
                      : "border-[var(--color-border)] hover:bg-[var(--color-muted)]/60"
                  }`}
                >
                  <span className="block font-display text-lg text-[var(--color-foreground)]">
                    {tab.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8">
            <article
              key={currentTab.id}
              role="tabpanel"
              id={`portal-panel-${currentTab.id}`}
              aria-labelledby={`portal-tab-${currentTab.id}`}
              className="cl-chronicle-enter"
            >
                <p className="text-sm text-[var(--color-muted-foreground)]">{currentTab.badge}</p>
                <h3 className="mt-2 font-display text-2xl font-medium tracking-tight text-[var(--color-foreground)]">
                  {currentTab.headline}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)] sm:text-base">
                  {currentTab.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {currentTab.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="border-l border-[var(--color-border)] pl-4 text-sm leading-relaxed text-[var(--color-foreground)]"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
                <p className="mt-8 text-xs text-[var(--color-muted-foreground)]">
                  {portals.modulesBadge}
                </p>
                <ol className="mt-2 space-y-1">
                  {currentTab.modules.map((mod, index) => (
                    <li key={mod} className="text-sm text-[var(--color-foreground)]">
                      <span className="mr-2 font-display text-[var(--color-accent)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {mod}
                    </li>
                  ))}
                </ol>
            </article>

            <div className="mt-8">
              <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVideoSurface("desktop")}
                  aria-pressed={videoSurface === "desktop"}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 px-2 text-xs transition-colors ${
                    videoSurface === "desktop"
                      ? "text-[var(--color-foreground)]"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" aria-hidden />
                  <span>{portals.videoSurfaceDesktop}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVideoSurface("mobile")}
                  aria-pressed={videoSurface === "mobile"}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 px-2 text-xs transition-colors ${
                    videoSurface === "mobile"
                      ? "text-[var(--color-foreground)]"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" aria-hidden />
                  <span>{portals.videoSurfaceMobile}</span>
                </button>
              </div>
              <video
                key={videoSrc}
                data-testid="pulsar-portal-video"
                src={videoSrc}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className={
                  videoSurface === "mobile"
                    ? "mx-auto max-h-[420px] w-auto object-contain"
                    : "aspect-video w-full object-cover"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
