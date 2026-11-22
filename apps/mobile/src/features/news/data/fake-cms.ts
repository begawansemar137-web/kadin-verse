import type { Article } from '../domain/article';
import type { NewsRequest, NewsResponse, NewsTransport } from './news-transport';

/** Server-side article record. Synthetic only (ADR-013 §3). */
export type CmsArticle = Omit<Article, 'publishedAt'> & {
  status: 'draft' | 'in_review' | 'published' | 'archived';
  publishedAt: string | null;
};

type Failure = 'offline' | 'server-error' | null;
type Key = { at: number; id: string };

const MAX_LIMIT = 50;
const CURSOR = /^(\d{1,15})\.([A-Za-z0-9-]{1,64})$/;

const encodeCursor = ({ at, id }: Key) => `${at}.${id}`;
const decodeCursor = (cursor: string): Key | null => {
  const match = CURSOR.exec(cursor);
  return match?.[1] && match[2] ? { at: Number(match[1]), id: match[2] } : null;
};
/** Newest first; ties broken by id desc so the order is total and the keyset is stable. */
const before = (a: Key, b: Key) => a.at < b.at || (a.at === b.at && a.id < b.id);

const toWire = ({ status: _status, ...article }: CmsArticle) => article;

export const createFakeCms = ({ articles, now = Date.now }: { articles: CmsArticle[]; now?: () => number }) => {
  let failure: Failure = null;
  let requestCount = 0;
  const requests: NewsRequest[] = [];

  const error = (status: number, code: string, message: string): NewsResponse => ({
    status,
    body: { error: { code, message, requestId: `fake-${requestCount}` } },
  });

  /** BR-003: only published articles whose publishedAt has passed are public. */
  const visible = () => {
    const at = now();
    return articles
      .flatMap((a) => {
        if (a.status !== 'published' || a.publishedAt === null) return [];
        const published = Date.parse(a.publishedAt);
        return published <= at ? [{ article: a, key: { at: published, id: a.id } }] : [];
      })
      .sort((x, y) => (before(x.key, y.key) ? 1 : -1));
  };

  const handle = (req: NewsRequest): NewsResponse => {
    if (req.route === 'detail') {
      const hit = visible().find((v) => v.article.id === req.id);
      return hit ? { status: 200, body: { data: toWire(hit.article) } } : error(404, 'NOT_FOUND', 'Article not found');
    }
    if (!Number.isInteger(req.limit) || req.limit < 1 || req.limit > MAX_LIMIT) {
      return error(400, 'INVALID_LIMIT', 'limit must be an integer from 1 to 50');
    }
    const after = req.cursor === null ? null : decodeCursor(req.cursor);
    if (req.cursor !== null && after === null) return error(400, 'INVALID_CURSOR', 'cursor is not valid');
    const remaining = visible().filter((v) => after === null || before(v.key, after));
    const pageItems = remaining.slice(0, req.limit);
    const last = pageItems[pageItems.length - 1];
    const nextCursor = remaining.length > req.limit && last ? encodeCursor(last.key) : null;
    return {
      status: 200,
      body: { data: pageItems.map((v) => toWire(v.article)), page: { nextCursor, limit: req.limit } },
    };
  };

  const transport: NewsTransport = async (req) => {
    requestCount += 1;
    requests.push(req);
    if (failure === 'offline') throw new Error('Network request failed');
    if (failure === 'server-error') return error(500, 'INTERNAL', 'Internal error');
    return handle(req);
  };

  return {
    transport,
    requests,
    configure: (options: { failure: Failure }) => {
      failure = options.failure;
    },
  };
};
