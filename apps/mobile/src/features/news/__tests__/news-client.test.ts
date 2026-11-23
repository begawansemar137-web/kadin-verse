import { createFakeCms } from '@/features/news/data/fake-cms';
import { createNewsClient } from '@/features/news/data/news-client';
import type { NewsTransport } from '@/features/news/data/news-transport';
import { SAMPLE_ARTICLES, SAMPLE_IDS } from '@/features/news/data/sample-articles';

const NOW = Date.parse('2026-11-22T00:00:00.000Z');
const client = () => {
  const cms = createFakeCms({ articles: SAMPLE_ARTICLES, now: () => NOW });
  return { cms, source: createNewsClient({ transport: cms.transport, isMock: true }) };
};

describe('news client over the fake CMS', () => {
  it('lists the first page of 10 with a cursor, then the remaining 2', async () => {
    const { source } = client();
    const first = await source.listPublished(null);
    if (!first.ok) throw new Error('expected ok');
    expect(first.value.items).toHaveLength(10);
    expect(first.value.items[0]?.id).toBe(SAMPLE_IDS.firstPublished);
    const second = await source.listPublished(first.value.nextCursor);
    expect(second.ok && second.value.items).toHaveLength(2);
    expect(second.ok && second.value.nextCursor).toBeNull();
  });

  it('never lists draft, in-review, archived or scheduled sample articles', async () => {
    const { source } = client();
    const ids: string[] = [];
    let cursor: string | null = null;
    do {
      const res = await source.listPublished(cursor);
      if (!res.ok) throw new Error('expected ok');
      ids.push(...res.value.items.map((a) => a.id));
      cursor = res.value.nextCursor;
    } while (cursor !== null);
    expect(ids).toHaveLength(12);
    for (const hidden of [SAMPLE_IDS.draft, SAMPLE_IDS.inReview, SAMPLE_IDS.archived, SAMPLE_IDS.scheduled]) {
      expect(ids).not.toContain(hidden);
    }
  });

  it('returns a public article, and not-found for a draft', async () => {
    const { source } = client();
    const ok = await source.getPublished(SAMPLE_IDS.firstPublished);
    expect(ok.ok && ok.value.body.length).toBeGreaterThan(0);
    expect(await source.getPublished(SAMPLE_IDS.draft)).toEqual({ ok: false, reason: 'not-found' });
  });

  it('maps a network failure to offline and a 500 to unavailable', async () => {
    const { cms, source } = client();
    cms.configure({ failure: 'offline' });
    expect(await source.listPublished(null)).toEqual({ ok: false, reason: 'offline' });
    cms.configure({ failure: 'server-error' });
    expect(await source.getPublished(SAMPLE_IDS.firstPublished)).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('Review Focus 1: maps a malformed 200 body to unavailable (contract violation)', async () => {
    const transport: NewsTransport = async () => ({
      status: 200,
      body: { data: [{ id: 'x' }], page: { nextCursor: null, limit: 10 } },
    });
    const source = createNewsClient({ transport, isMock: false });
    expect(await source.listPublished(null)).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('asks the transport for NEWS_PAGE_SIZE items', async () => {
    const { cms, source } = client();
    await source.listPublished(null);
    expect(cms.requests).toEqual([{ route: 'list', cursor: null, limit: 10 }]);
  });
});

describe('sample articles', () => {
  it('are visibly synthetic and use only reserved image hosts', () => {
    for (const a of SAMPLE_ARTICLES) {
      expect(a.title.startsWith('[Contoh]')).toBe(true);
      if (a.image) expect(a.image.url).toMatch(/^https:\/\/[^/]+\.invalid\//);
    }
  });
});
