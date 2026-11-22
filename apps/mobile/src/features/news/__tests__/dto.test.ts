import { parseArticleDetail, parseArticleSummaryPage } from '@/features/news/domain/dto';

const summary = {
  id: 'a1b2c3d4-0000-4000-8000-000000000001',
  title: '[Contoh] Judul',
  summary: 'Ringkasan',
  publishedAt: '2026-11-01T03:00:00.000Z',
  image: { url: 'https://cdn.example.invalid/a.jpg', alt: 'Foto contoh' },
};
const page = (data: unknown[], nextCursor: string | null = null) => ({ data, page: { nextCursor, limit: 10 } });

describe('parseArticleSummaryPage', () => {
  it('accepts the provisional envelope', () => {
    expect(parseArticleSummaryPage(page([summary], 'c1'))).toEqual({ items: [summary], nextCursor: 'c1' });
  });

  it('accepts an empty last page', () => {
    expect(parseArticleSummaryPage(page([]))).toEqual({ items: [], nextCursor: null });
  });

  it.each([
    ['not an object', 'x'],
    ['missing data', { page: { nextCursor: null, limit: 10 } }],
    ['missing page', { data: [] }],
    ['non-string cursor', { data: [], page: { nextCursor: 5, limit: 10 } }],
    ['item missing title', page([{ ...summary, title: undefined }])],
    ['item with empty title', page([{ ...summary, title: '  ' }])],
    ['item with unroutable id', page([{ ...summary, id: '../card' }])],
    ['item with non-ISO date', page([{ ...summary, publishedAt: 'yesterday' }])],
  ])('rejects the whole page when %s', (_label, raw) => {
    expect(parseArticleSummaryPage(raw)).toBeNull();
  });

  it.each([
    ['missing alt', { url: 'https://cdn.example.invalid/a.jpg' }],
    ['blank alt', { url: 'https://cdn.example.invalid/a.jpg', alt: ' ' }],
    ['http url', { url: 'http://cdn.example.invalid/a.jpg', alt: 'Foto' }],
    ['javascript url', { url: 'javascript:alert(1)', alt: 'Foto' }],
    ['not an object', 'https://cdn.example.invalid/a.jpg'],
  ])('drops an image with %s but keeps the article (BR-005)', (_label, image) => {
    expect(parseArticleSummaryPage(page([{ ...summary, image }]))?.items[0]?.image).toBeNull();
  });
});

describe('publishedAt (contract: UTC ISO-8601, SPEC-005)', () => {
  it('accepts microsecond precision from the server and normalises it to milliseconds', () => {
    const parsed = parseArticleSummaryPage(page([{ ...summary, publishedAt: '2026-11-01T03:00:00.123456Z' }]));
    expect(parsed?.items[0]?.publishedAt).toBe('2026-11-01T03:00:00.123Z');
  });

  it('accepts a timestamp without fractional seconds', () => {
    const parsed = parseArticleSummaryPage(page([{ ...summary, publishedAt: '2026-11-01T03:00:00Z' }]));
    expect(parsed?.items[0]?.publishedAt).toBe('2026-11-01T03:00:00Z');
  });

  it('rejects a non-UTC offset, which the contract does not allow', () => {
    expect(parseArticleSummaryPage(page([{ ...summary, publishedAt: '2026-11-01T10:00:00+07:00' }]))).toBeNull();
  });
});

describe('parseArticleDetail', () => {
  it('accepts a detail envelope with a body', () => {
    expect(parseArticleDetail({ data: { ...summary, body: 'Isi.' } })).toEqual({ ...summary, body: 'Isi.' });
  });

  it('rejects a detail without a string body', () => {
    expect(parseArticleDetail({ data: { ...summary } })).toBeNull();
    expect(parseArticleDetail({ data: { ...summary, body: 42 } })).toBeNull();
  });

  it('rejects anything that is not an envelope', () => {
    expect(parseArticleDetail(null)).toBeNull();
    expect(parseArticleDetail({ ...summary, body: 'Isi.' })).toBeNull();
  });
});
