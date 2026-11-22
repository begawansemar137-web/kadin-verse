import type { Article, ArticleSummary, Page } from './article';

export type NewsFailure = 'offline' | 'not-found' | 'unavailable';
export type NewsResult<T> = { ok: true; value: T } | { ok: false; reason: NewsFailure };

/** What screens depend on (ADR-013). Implementations never throw. */
export type NewsSource = {
  isMock: boolean;
  listPublished(cursor: string | null): Promise<NewsResult<Page<ArticleSummary>>>;
  getPublished(id: string): Promise<NewsResult<Article>>;
};

export const NEWS_PAGE_SIZE = 10;
