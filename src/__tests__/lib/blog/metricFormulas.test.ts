// REGRESSION CHECK: Blog visibility, guest comments, and 30-day rates must stay aligned with the 2026-10-28 spec.
import { describe, expect, it } from "vitest";
import { blogStatsRates } from "@/lib/blog/metricFormulas";

describe("blogStatsRates", () => {
  it("returns reading 0 and null rates when views are 0", () => {
    expect(
      blogStatsRates({
        articleViews: 0,
        indexArticleViews: 0,
        listViews: 0,
        articles: [
          {
            articleId: "quiet",
            views: 0,
            ctaClicks: 4,
            visibleComments: 2,
            hasCta: true,
          },
        ],
      }),
    ).toEqual({
      reading: 0,
      listToArticle: null,
      ctaRate: null,
      commentRate: null,
      rows: [
        {
          articleId: "quiet",
          reading: 0,
          ctaRate: null,
          commentRate: null,
        },
      ],
    });
  });

  it("divides index article views by list views", () => {
    const rates = blogStatsRates({
      articleViews: 10,
      indexArticleViews: 10,
      listViews: 40,
      articles: [],
    });
    expect(rates.listToArticle).toBe(0.25);
  });

  it("counts CTA clicks only on rows that have a call to action", () => {
    const rates = blogStatsRates({
      articleViews: 110,
      indexArticleViews: 0,
      listViews: 0,
      articles: [
        {
          articleId: "with-cta",
          views: 10,
          ctaClicks: 2,
          visibleComments: 0,
          hasCta: true,
        },
        {
          articleId: "no-cta",
          views: 100,
          ctaClicks: 50,
          visibleComments: 0,
          hasCta: false,
        },
      ],
    });
    expect(rates.ctaRate).toBe(0.2);
    expect(rates.rows.find((row) => row.articleId === "with-cta")?.ctaRate).toBe(0.2);
    expect(rates.rows.find((row) => row.articleId === "no-cta")?.ctaRate).toBeNull();
  });

  it("sorts rows by reading descending", () => {
    const rates = blogStatsRates({
      articleViews: 8,
      indexArticleViews: 0,
      listViews: 1,
      articles: [
        {
          articleId: "low",
          views: 1,
          ctaClicks: 0,
          visibleComments: 0,
          hasCta: false,
        },
        {
          articleId: "high",
          views: 5,
          ctaClicks: 1,
          visibleComments: 0,
          hasCta: true,
        },
        {
          articleId: "mid",
          views: 2,
          ctaClicks: 0,
          visibleComments: 0,
          hasCta: false,
        },
      ],
    });
    expect(rates.rows.map((row) => row.articleId)).toEqual(["high", "mid", "low"]);
    expect(rates.rows.map((row) => row.reading)).toEqual([5, 2, 1]);
  });

  it("divides visible comments by views for the site and for each row", () => {
    const rates = blogStatsRates({
      articleViews: 40,
      indexArticleViews: 0,
      listViews: 1,
      articles: [
        {
          articleId: "a",
          views: 10,
          ctaClicks: 0,
          visibleComments: 2,
          hasCta: false,
        },
        {
          articleId: "b",
          views: 10,
          ctaClicks: 0,
          visibleComments: 2,
          hasCta: false,
        },
        {
          articleId: "empty",
          views: 0,
          ctaClicks: 0,
          visibleComments: 3,
          hasCta: false,
        },
      ],
    });
    expect(rates.reading).toBe(40);
    expect(rates.commentRate).toBe(7 / 40);
    expect(rates.rows.find((row) => row.articleId === "a")?.commentRate).toBe(0.2);
    expect(rates.rows.find((row) => row.articleId === "b")?.commentRate).toBe(0.2);
    expect(rates.rows.find((row) => row.articleId === "empty")?.commentRate).toBeNull();
  });
});
