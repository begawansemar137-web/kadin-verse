import { act, renderHook, waitFor } from '@testing-library/react-native';

import { createFakeCms } from '@/features/news/data/fake-cms';
import { createNewsClient } from '@/features/news/data/news-client';
import { SAMPLE_ARTICLES, SAMPLE_IDS } from '@/features/news/data/sample-articles';
import { useArticle } from '@/features/news/data/use-article';

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
