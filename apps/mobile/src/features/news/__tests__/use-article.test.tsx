import { act, renderHook, waitFor } from '@testing-library/react-native';

import { createFakeCms } from '@/features/news/data/fake-cms';
import { createNewsClient } from '@/features/news/data/news-client';
import { SAMPLE_ARTICLES, SAMPLE_IDS } from '@/features/news/data/sample-articles';
import { useArticle } from '@/features/news/data/use-article';
import type { NewsSource } from '@/features/news/domain/news-source';

const NOW = Date.parse('2026-11-22T00:00:00.000Z');
const setup = () => {
  const cms = createFakeCms({ articles: SAMPLE_ARTICLES, now: () => NOW });
  return { cms, source: createNewsClient({ transport: cms.transport, isMock: true }) };
};

describe('useArticle', () => {
  it('loads a public article', async () => {
    const { source } = setup();
    const { result } = await renderHook(() => useArticle(source, SAMPLE_IDS.firstPublished));
    await waitFor(() => expect(result.current.view.status).toBe('success'));
  });

  it('reports not-found for a draft', async () => {
    const { source } = setup();
    const { result } = await renderHook(() => useArticle(source, SAMPLE_IDS.draft));
    await waitFor(() => expect(result.current.view).toEqual({ status: 'not-found' }));
  });

  it('reports not-found when there is no source', async () => {
    const { result } = await renderHook(() => useArticle(null, SAMPLE_IDS.firstPublished));
    expect(result.current.view).toEqual({ status: 'not-found' });
  });

  it('Review Focus 4: a stale response cannot overwrite a newer one', async () => {
    const pending: ((r: Awaited<ReturnType<NewsSource['getPublished']>>) => void)[] = [];
    const source: NewsSource = {
      isMock: true,
      listPublished: async () => ({ ok: false, reason: 'unavailable' }),
      getPublished: () => new Promise((r) => pending.push(r)),
    };
    const article = (title: string) => ({
      id: 'a-1',
      title,
      summary: '',
      body: 'Isi',
      publishedAt: '2026-11-01T03:00:00.000Z',
      image: null,
    });
    const { result } = await renderHook(() => useArticle(source, 'a-1'));
    await act(async () => result.current.retry());
    expect(pending).toHaveLength(2);
    await act(async () => pending[1]?.({ ok: true, value: article('newer') }));
    await act(async () => pending[0]?.({ ok: true, value: article('stale') }));
    const view = result.current.view;
    expect(view.status === 'success' && view.data.title).toBe('newer');
  });

  it('shows offline and recovers on retry', async () => {
    const { cms, source } = setup();
    cms.configure({ failure: 'offline' });
    const { result } = await renderHook(() => useArticle(source, SAMPLE_IDS.firstPublished));
    await waitFor(() => expect(result.current.view).toEqual({ status: 'offline' }));
    cms.configure({ failure: null });
    await act(async () => result.current.retry());
    await waitFor(() => expect(result.current.view.status).toBe('success'));
  });
});
