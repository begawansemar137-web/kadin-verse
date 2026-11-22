/** Client view of a public article (ADR-013). Only published, eligible articles ever reach the client. */
export type ArticleImage = { url: string; alt: string };

export type ArticleSummary = {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  image: ArticleImage | null;
};

export type Article = ArticleSummary & { body: string };

export type Page<T> = { items: T[]; nextCursor: string | null };
