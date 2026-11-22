import { parseArticleDetail, parseArticleSummaryPage } from '../domain/dto';
import { NEWS_PAGE_SIZE, type NewsResult, type NewsSource } from '../domain/news-source';
import type { NewsRequest, NewsResponse, NewsTransport } from './news-transport';

const send = async (transport: NewsTransport, req: NewsRequest): Promise<NewsResponse | null> => {
  try {
    return await transport(req);
  } catch {
    return null;
  }
};

const toResult = <T,>(res: NewsResponse | null, parse: (body: unknown) => T | null): NewsResult<T> => {
  if (res === null) return { ok: false, reason: 'offline' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  const value = res.status === 200 ? parse(res.body) : null;
  return value === null ? { ok: false, reason: 'unavailable' } : { ok: true, value };
};

/** Client side of the public news contract: every response is validated before it reaches the UI (ADR-013 §2). */
export const createNewsClient = ({ transport, isMock }: { transport: NewsTransport; isMock: boolean }): NewsSource => ({
  isMock,
  listPublished: async (cursor) =>
    toResult(await send(transport, { route: 'list', cursor, limit: NEWS_PAGE_SIZE }), parseArticleSummaryPage),
  getPublished: async (id) => toResult(await send(transport, { route: 'detail', id }), parseArticleDetail),
});
