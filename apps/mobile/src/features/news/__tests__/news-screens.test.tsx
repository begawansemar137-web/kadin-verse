import type { ReactElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { createFakeCms } from '@/features/news/data/fake-cms';
import { createNewsClient } from '@/features/news/data/news-client';
import { SAMPLE_ARTICLES, SAMPLE_IDS } from '@/features/news/data/sample-articles';
import type { NewsSource } from '@/features/news/domain/news-source';
import { NewsSourceProvider } from '@/features/news/news-source-context';
import { ArticleDetailScreen } from '@/features/news/screens/ArticleDetailScreen';
import { NewsFeedScreen } from '@/features/news/screens/NewsFeedScreen';
import { copy } from '@/shared/copy/id';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

const NOW = Date.parse('2026-11-22T00:00:00.000Z');
const fake = () => {
  const cms = createFakeCms({ articles: SAMPLE_ARTICLES, now: () => NOW });
  return { cms, source: createNewsClient({ transport: cms.transport, isMock: true }) };
};
const withSource = (source: NewsSource | null, ui: ReactElement) =>
  render(<NewsSourceProvider source={source}>{ui}</NewsSourceProvider>);

describe('NewsFeedScreen', () => {
  it('shows the empty message and no mock badge when there is no source', async () => {
    await withSource(null, <NewsFeedScreen />);
    expect(screen.getByText(copy.news.empty)).toBeTruthy();
    expect(screen.queryByLabelText(copy.common.mockBadgeA11y)).toBeNull();
  });

  it('labels synthetic content and loads more on request', async () => {
    await withSource(fake().source, <NewsFeedScreen />);
    expect(screen.getByLabelText(copy.common.mockBadgeA11y)).toBeTruthy();
    expect(await screen.findByText('[Contoh] Forum UMKM Daerah')).toBeTruthy();
    expect(screen.queryByText('[Contoh] Pameran Produk Lokal')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: copy.news.loadMore }));
    expect(await screen.findByText('[Contoh] Pameran Produk Lokal')).toBeTruthy();
    expect(screen.queryByRole('button', { name: copy.news.loadMore })).toBeNull();
  });

  it('announces a failed load-more as an alert and keeps the list', async () => {
    const { cms, source } = fake();
    await withSource(source, <NewsFeedScreen />);
    expect(await screen.findByText('[Contoh] Forum UMKM Daerah')).toBeTruthy();
    cms.configure({ failure: 'offline' });
    await fireEvent.press(screen.getByRole('button', { name: copy.news.loadMore }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(copy.news.loadMoreFailed));
    expect(screen.getByText('[Contoh] Forum UMKM Daerah')).toBeTruthy();
  });

  it('shows the error state with retry when the service fails', async () => {
    const { cms, source } = fake();
    cms.configure({ failure: 'server-error' });
    await withSource(source, <NewsFeedScreen />);
    expect(await screen.findByText(copy.news.loadFailed)).toBeTruthy();
    cms.configure({ failure: null });
    await fireEvent.press(screen.getByRole('button', { name: copy.common.retry }));
    expect(await screen.findByText('[Contoh] Forum UMKM Daerah')).toBeTruthy();
  });
});

describe('ArticleDetailScreen', () => {
  it('renders the article title, date and every body paragraph as plain text', async () => {
    await withSource(fake().source, <ArticleDetailScreen id={SAMPLE_IDS.firstPublished} />);
    expect(await screen.findByRole('header', { name: '[Contoh] Forum UMKM Daerah' })).toBeTruthy();
    expect(screen.getByText(copy.news.published('30 Okt 2026'))).toBeTruthy();
    expect(screen.getByText('Ini adalah artikel contoh tentang forum umkm daerah.')).toBeTruthy();
    expect(screen.getByText('Konten ini sintetis dan hanya untuk pengujian.')).toBeTruthy();
    expect(screen.getByLabelText(copy.common.mockBadgeA11y)).toBeTruthy();
  });

  it('shows not-found for an invalid id without calling the source', async () => {
    const { cms, source } = fake();
    await withSource(source, <ArticleDetailScreen id="bad id" />);
    expect(screen.getByText(copy.news.notFound)).toBeTruthy();
    expect(cms.requests).toHaveLength(0);
  });
});
