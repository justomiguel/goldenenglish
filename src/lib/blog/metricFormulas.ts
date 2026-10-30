type ArticleMetricInput = {
  articleId: string;
  views: number;
  ctaClicks: number;
  visibleComments: number;
  hasCta: boolean;
};

type ArticleMetricRow = {
  articleId: string;
  reading: number;
  ctaRate: number | null;
  commentRate: number | null;
};

function rate(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return numerator / denominator;
}

export function blogStatsRates(input: {
  articleViews: number;
  indexArticleViews: number;
  listViews: number;
  articles: ArticleMetricInput[];
}): {
  reading: number;
  listToArticle: number | null;
  ctaRate: number | null;
  commentRate: number | null;
  rows: ArticleMetricRow[];
} {
  let ctaViews = 0;
  let ctaClicks = 0;
  let visibleComments = 0;

  for (const article of input.articles) {
    visibleComments += article.visibleComments;
    if (!article.hasCta) continue;
    ctaViews += article.views;
    ctaClicks += article.ctaClicks;
  }

  const rows = input.articles
    .map((article): ArticleMetricRow => ({
      articleId: article.articleId,
      reading: article.views,
      ctaRate: article.hasCta ? rate(article.ctaClicks, article.views) : null,
      commentRate: rate(article.visibleComments, article.views),
    }))
    .toSorted((left, right) => right.reading - left.reading);

  return {
    reading: input.articleViews,
    listToArticle: rate(input.indexArticleViews, input.listViews),
    ctaRate: rate(ctaClicks, ctaViews),
    commentRate: rate(visibleComments, input.articleViews),
    rows,
  };
}
