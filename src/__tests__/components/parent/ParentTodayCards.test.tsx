import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ParentTodayCards } from "@/components/parent/ParentTodayCards";
import type { ParentTodayCard, ParentTodayFeed } from "@/lib/parent/buildParentTodayFeed";
import { dictEn } from "@/test/dictEn";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const copy = dictEn.dashboard.parent.today;

function card(overrides: Partial<ParentTodayCard> = {}): ParentTodayCard {
  return {
    kind: "unreadMessages",
    tone: "attention",
    count: 1,
    detail: null,
    href: "/en/dashboard/parent/messages",
    ...overrides,
  };
}

function feed(overrides: Partial<ParentTodayFeed> = {}): ParentTodayFeed {
  const cards = overrides.cards ?? [];
  return {
    cards,
    visible: cards.slice(0, 3),
    hasMore: cards.length > 3,
    failures: [],
    ...overrides,
  };
}

beforeEach(() => {
  refresh.mockClear();
});

describe("ParentTodayCards", () => {
  it("says everything is clear only when there is nothing to report", () => {
    render(<ParentTodayCards feed={feed()} copy={copy} />);
    expect(screen.getByText(copy.allClearTitle)).toBeTruthy();
  });

  it("does not claim all clear while a read is failing, since silence would be a lie", () => {
    render(<ParentTodayCards feed={feed({ failures: ["payments"] })} copy={copy} />);

    expect(screen.queryByText(copy.allClearTitle)).toBeNull();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("retries a failed source in place", () => {
    render(<ParentTodayCards feed={feed({ failures: ["messages"] })} copy={copy} />);

    fireEvent.click(screen.getByRole("button", { name: copy.failureRetry }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("keeps the overflow behind a toggle so the fold stays short", () => {
    const cards = [
      card({ kind: "paymentOverdue", href: "/payments" }),
      card({ kind: "unreadMessages" }),
      card({ kind: "taskDueSoon", href: "/tasks" }),
      card({ kind: "absence", href: "/attendance" }),
    ];
    render(<ParentTodayCards feed={feed({ cards })} copy={copy} />);

    const toggle = screen.getByRole("button", { name: copy.seeAll });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: copy.seeLess }).getAttribute("aria-expanded")).toBe(
      "true",
    );
  });
});
