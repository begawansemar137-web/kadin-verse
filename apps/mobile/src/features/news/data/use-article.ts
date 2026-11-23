import { useCallback, useEffect, useRef, useState } from 'react';

import { copy } from '@/shared/copy/id';
import type { AsyncState } from '@/shared/domain/async-state';

import type { Article } from '../domain/article';
import type { NewsSource } from '../domain/news-source';

export type ArticleView = AsyncState<Article> | { status: 'not-found' };

/** One public article. Unknown and non-public ids both resolve to `not-found` (ADR-013 §5). */
export const useArticle = (source: NewsSource | null, id: string) => {
  const [view, setView] = useState<ArticleView>(source ? { status: 'loading' } : { status: 'not-found' });
  const generation = useRef(0);

  // State is only set in the response callback, never synchronously in the effect (react-hooks/set-state-in-effect).
  const fetchArticle = useCallback(() => {
    if (!source) return;
    const gen = ++generation.current;
    void source.getPublished(id).then((res) => {
      if (gen !== generation.current) return;
      if (res.ok) setView({ status: 'success', data: res.value });
      else if (res.reason === 'not-found') setView({ status: 'not-found' });
      else if (res.reason === 'offline') setView({ status: 'offline' });
      else setView({ status: 'error', message: copy.news.loadFailed });
    });
  }, [source, id]);

  useEffect(() => {
    fetchArticle();
    return () => {
      generation.current += 1;
    };
  }, [fetchArticle]);

  const retry = useCallback(() => {
    if (!source) return;
    setView({ status: 'loading' });
    fetchArticle();
  }, [source, fetchArticle]);

  return { view, retry };
};
