import { createFakeCms, type CmsArticle } from '@/features/news/data/fake-cms';

const NOW = Date.parse('2026-11-22T00:00:00.000Z');
const article = (n: number, over: Partial<CmsArticle> = {}): CmsArticle => ({
  id: `art-${String(n).padStart(4, '0')}`,
  title: `[Contoh] Berita ${n}`,
  summary: `Ringkasan ${n}`,
  body: `Isi ${n}`,
  status: 'published',
  publishedAt: new Date(NOW - n * 3_600_000).toISOString(),
  image: null,
  ...over,
});
type ListBody = { data: { id: string }[]; page: { nextCursor: string | null; limit: number } };
const list = async (cms: ReturnType<typeof createFakeCms>, cursor: string | null, limit = 2) => {
  const res = await cms.transport({ route: 'list', cursor, limit });
  return { status: res.status, body: res.body as ListBody };
};

describe('fake CMS visibility (BR-003)', () => {
  const articles = [
    article(1),
    article(2, { status: 'draft' }),
    article(3, { status: 'in_review' }),
    article(4, { status: 'archived' }),
    article(5, { publishedAt: '2099-01-01T00:00:00.000Z' }),
    article(6, { publishedAt: null }),
  ];

  it('AC-005-01/02: the feed lists only published articles that are already due', async () => {
    const cms = createFakeCms({ articles, now: () => NOW });
    const { body } = await list(cms, null, 50);
    expect(body.data.map((a) => a.id)).toEqual(['art-0001']);
  });

  it.each(['art-0002', 'art-0003', 'art-0004', 'art-0005', 'art-0006', 'missing'])(
    'detail of a non-public article %s is 404 with the error envelope',
    async (id) => {
      const cms = createFakeCms({ articles, now: () => NOW });
      const res = await cms.transport({ route: 'detail', id });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: { code: 'NOT_FOUND', message: expect.any(String), requestId: expect.any(String) },
      });
    },
  );

  it('a scheduled article appears once its time has come', async () => {
    let now = NOW;
    const cms = createFakeCms({
      articles: [article(1, { publishedAt: new Date(NOW + 60_000).toISOString() })],
      now: () => now,
    });
    expect((await list(cms, null)).body.data).toHaveLength(0);
    now = NOW + 60_000;
    expect((await list(cms, null)).body.data).toHaveLength(1);
  });
});

describe('fake CMS keyset pagination (BR-004)', () => {
  it('pages newest first with a cursor, then ends with nextCursor null', async () => {
    const cms = createFakeCms({ articles: [article(3), article(1), article(2)], now: () => NOW });
    const first = await list(cms, null);
    expect(first.body.data.map((a) => a.id)).toEqual(['art-0001', 'art-0002']);
    const second = await list(cms, first.body.page.nextCursor);
    expect(second.body.data.map((a) => a.id)).toEqual(['art-0003']);
    expect(second.body.page.nextCursor).toBeNull();
  });

  it('breaks publishedAt ties by id desc, so no item is skipped or repeated', async () => {
    const same = new Date(NOW - 1000).toISOString();
    const cms = createFakeCms({
      articles: ['a', 'b', 'c'].map((id) => ({ ...article(1), id, publishedAt: same })),
      now: () => NOW,
    });
    const first = await list(cms, null);
    const second = await list(cms, first.body.page.nextCursor);
    expect([...first.body.data, ...second.body.data].map((a) => a.id)).toEqual(['c', 'b', 'a']);
  });

  it('AC-005-05: an article that becomes eligible between pages causes no duplicates', async () => {
    let now = NOW;
    const late = article(9, { id: 'art-late', publishedAt: new Date(NOW + 1000).toISOString() });
    const cms = createFakeCms({ articles: [article(1), article(2), article(3), late], now: () => now });
    const first = await list(cms, null);
    now = NOW + 1000;
    const second = await list(cms, first.body.page.nextCursor);
    const ids = [...first.body.data, ...second.body.data].map((a) => a.id);
    expect(ids).toEqual(['art-0001', 'art-0002', 'art-0003']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each([['garbage'], ['123'], ['.art-0001']])('rejects a malformed cursor %s with 400', async (cursor) => {
    const cms = createFakeCms({ articles: [article(1)], now: () => NOW });
    expect((await list(cms, cursor)).status).toBe(400);
  });

  it.each([0, 51, 1.5])('rejects limit %s with 400', async (limit) => {
    const cms = createFakeCms({ articles: [article(1)], now: () => NOW });
    expect((await cms.transport({ route: 'list', cursor: null, limit })).status).toBe(400);
  });
});

describe('fake CMS failure modes', () => {
  it('rejects the transport when configured offline, and returns 500 for server-error', async () => {
    const cms = createFakeCms({ articles: [article(1)], now: () => NOW });
    cms.configure({ failure: 'offline' });
    await expect(cms.transport({ route: 'list', cursor: null, limit: 2 })).rejects.toThrow();
    cms.configure({ failure: 'server-error' });
    expect((await cms.transport({ route: 'list', cursor: null, limit: 2 })).status).toBe(500);
  });
});
