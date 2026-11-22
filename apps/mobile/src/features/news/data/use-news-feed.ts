import { useCallback, useEffect, useRef, useState } from 'react';

import { copy } from '@/shared/copy/id';
import type { AsyncState } from '@/shared/domain/async-state';

import type { ArticleSummary } from '../domain/article';
import type { NewsFailure, NewsSource } from '../domain/news-source';

type Feed = {
  list: AsyncState<ArticleSummary[]>;
  nextCursor: string | null;
  loadingMore: boolean;
  loadMoreFailed: boolean;
};

const initialFeed = (source: NewsSource | null): Feed => ({
  list: source ? { status: 'loading' } : { status: 'empty' },
  nextCursor: null,
  loadingMore: false,
  loadMoreFailed: false,
});

const failureState = (reason: NewsFailure): AsyncState<never> =>
  reason === 'offline' ? { status: 'offline' } : { status: 'error', message: copy.news.loadFailed };

/** Paginated public feed (ADR-013 §1): first page on mount, explicit load-more, late responses dropped. */
export const useNewsFeed = (source: NewsSource | null) => {
  const [feed, setFeed] = useState<Feed>(() => initialFeed(source));
  // Bumped on unmount and on every first-page load, so a response from an older request is ignored.
  const generation = useRef(0);
  const loadingMore = useRef(false);

  // State is only set in the response callback, never synchronously in the effect (react-hooks/set-state-in-effect).
  const fetchFirst = useCallback(() => {
    if (!source) return;
    const gen = ++generation.current;
    loadingMore.current = false;
    void source.listPublished(null).then((res) => {
      if (gen !== generation.current) return;
      if (!res.ok) {
        setFeed({ ...initialFeed(source), list: failureState(res.reason) });
        return;
      }
      const { items, nextCursor } = res.value;
      setFeed({
        ...initialFeed(source),
        list: items.length === 0 ? { status: 'empty' } : { status: 'success', data: items },
        nextCursor,
      });
    });
  }, [source]);

  useEffect(() => {
    fetchFirst();
    return () => {
      generation.current += 1;
    };
  }, [fetchFirst]);

  const retry = useCallback(() => {
    setFeed(initialFeed(source));
    fetchFirst();
  }, [source, fetchFirst]);

  const loadMore = useCallback(() => {
    const cursor = feed.nextCursor;
    if (!source || cursor === null || loadingMore.current || feed.list.status !== 'success') return;
    loadingMore.current = true;
    const gen = generation.current;
    setFeed((f) => ({ ...f, loadingMore: true, loadMoreFailed: false }));
    void source.listPublished(cursor).then((res) => {
      if (gen !== generation.current) return;
      loadingMore.current = false;
      setFeed((f) => {
        if (!res.ok || f.list.status !== 'success') return { ...f, loadingMore: false, loadMoreFailed: !res.ok };
        return {
          list: { status: 'success', data: [...f.list.data, ...res.value.items] },
          nextCursor: res.value.nextCursor,
          loadingMore: false,
          loadMoreFailed: false,
        };
      });
    });
  }, [source, feed.nextCursor, feed.list.status]);

  return {
    list: feed.list,
    hasMore: feed.nextCursor !== null,
    loadingMore: feed.loadingMore,
    loadMoreFailed: feed.loadMoreFailed,
    retry,
    loadMore,
  };
};
