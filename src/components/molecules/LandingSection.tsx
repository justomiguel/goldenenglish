interface LandingSectionProps {
  id?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function LandingSection({
  id,
  title,
  children,
  className = "",
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 px-4 py-16 md:scroll-mt-28 md:py-24 ${className}`}
    >
      <div className="mx-auto max-w-[var(--layout-max-width)]">
        <header className="mb-12 md:mb-14">
          <div className="flex flex-col items-center gap-3 text-center">
            <span
              className="h-1 w-12 rounded-full bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            <h2 className="font-display max-w-3xl text-3xl font-semibold tracking-tight text-[var(--color-primary)] md:text-4xl">
              {title}
            </h2>
          </div>
        </header>
        {children}
      </div>
    </section>
  );
}
