import { act, renderHook, waitFor } from '@testing-library/react-native';

import { createFakeCms } from '@/features/news/data/fake-cms';
import { createNewsClient } from '@/features/news/data/news-client';
import { SAMPLE_ARTICLES } from '@/features/news/data/sample-articles';
import { useNewsFeed } from '@/features/news/data/use-news-feed';
import type { NewsSource } from '@/features/news/domain/news-source';
import { copy } from '@/shared/copy/id';

const NOW = Date.parse('2026-11-22T00:00:00.000Z');
const setup = () => {
  const cms = createFakeCms({ articles: SAMPLE_ARTICLES, now: () => NOW });
  return { cms, source: createNewsClient({ transport: cms.transport, isMock: true }) };
};
const pendingSource = (): { source: NewsSource; resolve: () => void } => {
  let resolve: () => void = () => undefined;
  const source: NewsSource = {
    isMock: true,
    listPublished: () =>
      new Promise((r) => {
        resolve = () => r({ ok: true, value: { items: [], nextCursor: null } });
      }),
    getPublished: async () => ({ ok: false, reason: 'not-found' }),
  };
  return { source, resolve: () => resolve() };
};

describe('useNewsFeed', () => {
  it('is empty without a source and never loads', async () => {
    const { result } = await renderHook(() => useNewsFeed(null));
    expect(result.current.list).toEqual({ status: 'empty' });
    expect(result.current.hasMore).toBe(false);
  });

  it('is loading while the first page is in flight', async () => {
    const { result } = await renderHook(() => useNewsFeed(pendingSource().source));
    expect(result.current.list).toEqual({ status: 'loading' });
  });

  it('loads the first page, then appends the next one', async () => {
    const { source } = setup();
    const { result } = await renderHook(() => useNewsFeed(source));
    await waitFor(() => expect(result.current.list.status).toBe('success'));
    expect(result.current.hasMore).toBe(true);
    await act(async () => result.current.loadMore());
    await waitFor(() => expect(result.current.hasMore).toBe(false));
    const list = result.current.list;
    expect(list.status === 'success' && list.data).toHaveLength(12);
  });

  it('Review Focus 3: a double tap on load more fetches the next page once', async () => {
    const { cms, source } = setup();
    const { result } = await renderHook(() => useNewsFeed(source));
    await waitFor(() => expect(result.current.list.status).toBe('success'));
    await act(async () => {
      result.current.loadMore();
      result.current.loadMore();
    });
    await waitFor(() => expect(result.current.hasMore).toBe(false));
    expect(cms.requests).toHaveLength(2);
    const list = result.current.list;
    expect(list.status === 'success' && list.data).toHaveLength(12);
  });

  it('shows offline and recovers on retry', async () => {
    const { cms, source } = setup();
    cms.configure({ failure: 'offline' });
    const { result } = await renderHook(() => useNewsFeed(source));
    await waitFor(() => expect(result.current.list).toEqual({ status: 'offline' }));
    cms.configure({ failure: null });
    await act(async () => result.current.retry());
    await waitFor(() => expect(result.current.list.status).toBe('success'));
  });

  it('shows a safe error message when the service is unavailable', async () => {
    const { cms, source } = setup();
    cms.configure({ failure: 'server-error' });
    const { result } = await renderHook(() => useNewsFeed(source));
    await waitFor(() => expect(result.current.list).toEqual({ status: 'error', message: copy.news.loadFailed }));
  });

  it('keeps loaded items and flags the failure when load more fails', async () => {
    const { cms, source } = setup();
    const { result } = await renderHook(() => useNewsFeed(source));
    await waitFor(() => expect(result.current.list.status).toBe('success'));
    cms.configure({ failure: 'offline' });
    await act(async () => result.current.loadMore());
    await waitFor(() => expect(result.current.loadMoreFailed).toBe(true));
    const list = result.current.list;
    expect(list.status === 'success' && list.data).toHaveLength(10);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.loadingMore).toBe(false);
  });

  it('shows empty when the first page has no items', async () => {
    const cms = createFakeCms({ articles: [], now: () => NOW });
    const source = createNewsClient({ transport: cms.transport, isMock: true });
    const { result } = await renderHook(() => useNewsFeed(source));
    await waitFor(() => expect(result.current.list).toEqual({ status: 'empty' }));
  });

  it('Review Focus 4: a stale first-page response cannot overwrite a newer one', async () => {
    const pending: ((r: Awaited<ReturnType<NewsSource['listPublished']>>) => void)[] = [];
    const source: NewsSource = {
      isMock: true,
      listPublished: () => new Promise((r) => pending.push(r)),
      getPublished: async () => ({ ok: false, reason: 'not-found' }),
    };
    const item = (id: string) => ({ id, title: id, summary: '', publishedAt: '2026-11-01T03:00:00.000Z', image: null });
    const { result } = await renderHook(() => useNewsFeed(source));
    await act(async () => result.current.retry());
    expect(pending).toHaveLength(2);
    await act(async () => pending[1]?.({ ok: true, value: { items: [item('newer')], nextCursor: null } }));
    await act(async () => pending[0]?.({ ok: true, value: { items: [item('stale')], nextCursor: null } }));
    const list = result.current.list;
    expect(list.status === 'success' && list.data.map((a) => a.id)).toEqual(['newer']);
  });

  it('smoke: unmounting with a request in flight does not throw', async () => {
    const pending = pendingSource();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { unmount } = await renderHook(() => useNewsFeed(pending.source));
    await unmount();
    await act(async () => pending.resolve());
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
