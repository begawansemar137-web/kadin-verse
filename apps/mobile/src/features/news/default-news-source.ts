import { flags } from '@/shared/config/flags';

import { createFakeCms } from './data/fake-cms';
import { createNewsClient } from './data/news-client';
import { SAMPLE_ARTICLES } from './data/sample-articles';
import type { NewsSource } from './domain/news-source';

/** App wiring (ADR-013 §8): synthetic CMS only for dev/preview builds; no source otherwise. */
export const createDefaultNewsSource = ({
  mockContent = flags.mockContent,
}: { mockContent?: boolean } = {}): NewsSource | null =>
  mockContent
    ? createNewsClient({ transport: createFakeCms({ articles: SAMPLE_ARTICLES }).transport, isMock: true })
    : null;
