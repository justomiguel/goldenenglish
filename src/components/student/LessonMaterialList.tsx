import type { SignedLessonMaterial } from "@/lib/courses/lessonMaterials";

interface LessonMaterialListProps {
  items: readonly SignedLessonMaterial[];
  emptyLabel: string;
}

export function LessonMaterialList({ items, emptyLabel }: LessonMaterialListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{emptyLabel}</p>;
  }
  return (
    <div className="space-y-4">
      {items.map((item) => {
        if (item.kind === "html") {
          return (
            <div
              key={item.id}
              className="prose prose-sm max-w-prose text-[var(--color-foreground)]"
              dangerouslySetInnerHTML={{ __html: item.html }}
            />
          );
        }
        if (item.kind === "video") {
          return (
            <iframe
              key={item.id}
              src={item.embedUrl}
              title={item.label}
              className="aspect-video w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)]"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          );
        }
        if (item.kind === "file" || item.kind === "link") {
          return (
            <a
              key={item.id}
              href={item.href}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline"
              {...(item.kind === "link" ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              {item.label}
            </a>
          );
        }
        return (
          <p key={item.id} className="text-sm text-[var(--color-foreground)]">
            {item.prompt}
            {item.href ? (
              <>
                {" "}
                <a href={item.href} className="font-semibold text-[var(--color-primary)] underline">
                  {item.href}
                </a>
              </>
            ) : null}
          </p>
        );
      })}
    </div>
  );
}
